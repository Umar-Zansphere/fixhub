import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';

import { RedisService } from '../../../common/redis/redis.service';
import { AuthRepository } from '../repositories/auth.repository';
import { TokenService } from './token.service';

describe('TokenService', () => {
  let tokenService: TokenService;
  let jwtService: jest.Mocked<JwtService>;
  let redisService: jest.Mocked<RedisService>;
  let authRepository: jest.Mocked<AuthRepository>;

  const mockUser = {
    id: 'user-uuid-1',
    phone: '+919876543210',
    name: null,
    email: null,
    role: Role.CUSTOMER,
    isActive: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
            decode: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config: Record<string, any> = {
                'jwt.accessExpiration': '15m',
                'jwt.refreshExpiration': '7d',
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
        {
          provide: RedisService,
          useValue: {
            set: jest.fn(),
            exists: jest.fn(),
          },
        },
        {
          provide: AuthRepository,
          useValue: {
            createRefreshToken: jest.fn(),
            findRefreshToken: jest.fn(),
            revokeRefreshToken: jest.fn(),
            revokeAllRefreshTokens: jest.fn(),
          },
        },
      ],
    }).compile();

    tokenService = module.get<TokenService>(TokenService);
    jwtService = module.get(JwtService);
    redisService = module.get(RedisService);
    authRepository = module.get(AuthRepository);
  });

  it('should be defined', () => {
    expect(tokenService).toBeDefined();
  });

  // ── generateTokenPair ─────────────────────────────────

  describe('generateTokenPair', () => {
    it('should generate access and refresh tokens', async () => {
      authRepository.createRefreshToken.mockResolvedValue({} as any);

      const result = await tokenService.generateTokenPair(mockUser);

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.refreshToken).toBeDefined();
      expect(result.refreshToken).toHaveLength(128); // 64 bytes hex
      expect(result.expiresIn).toBe('15m');

      // Should store hashed refresh token in DB
      expect(authRepository.createRefreshToken).toHaveBeenCalledWith(
        expect.objectContaining({
          token: expect.any(String), // Hashed token
          userId: 'user-uuid-1',
          expiresAt: expect.any(Date),
        }),
      );
    });

    it('should sign JWT with correct payload', async () => {
      authRepository.createRefreshToken.mockResolvedValue({} as any);

      await tokenService.generateTokenPair(mockUser);

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 'user-uuid-1',
        phone: '+919876543210',
        role: Role.CUSTOMER,
      });
    });
  });

  // ── refreshTokens ─────────────────────────────────────

  describe('refreshTokens', () => {
    it('should throw for invalid refresh token', async () => {
      authRepository.findRefreshToken.mockResolvedValue(null);

      await expect(
        tokenService.refreshTokens('invalid-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should detect replay attack and revoke all tokens', async () => {
      authRepository.findRefreshToken.mockResolvedValue({
        id: 'token-id-1',
        token: 'hashed',
        userId: 'user-uuid-1',
        isRevoked: true, // Already used
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
        user: mockUser,
      } as any);

      await expect(
        tokenService.refreshTokens('stolen-token'),
      ).rejects.toThrow(UnauthorizedException);

      expect(authRepository.revokeAllRefreshTokens).toHaveBeenCalledWith('user-uuid-1');
    });

    it('should throw for expired refresh token', async () => {
      authRepository.findRefreshToken.mockResolvedValue({
        id: 'token-id-1',
        token: 'hashed',
        userId: 'user-uuid-1',
        isRevoked: false,
        expiresAt: new Date(Date.now() - 1000), // Expired
        createdAt: new Date(),
        user: mockUser,
      } as any);

      await expect(
        tokenService.refreshTokens('expired-token'),
      ).rejects.toThrow(UnauthorizedException);

      expect(authRepository.revokeRefreshToken).toHaveBeenCalledWith('token-id-1');
    });

    it('should throw for deactivated user', async () => {
      authRepository.findRefreshToken.mockResolvedValue({
        id: 'token-id-1',
        token: 'hashed',
        userId: 'user-uuid-1',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
        user: { ...mockUser, isActive: false },
      } as any);

      await expect(
        tokenService.refreshTokens('some-token'),
      ).rejects.toThrow(UnauthorizedException);

      expect(authRepository.revokeAllRefreshTokens).toHaveBeenCalledWith('user-uuid-1');
    });

    it('should rotate tokens on valid refresh', async () => {
      authRepository.findRefreshToken.mockResolvedValue({
        id: 'token-id-1',
        token: 'hashed',
        userId: 'user-uuid-1',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
        user: mockUser,
      } as any);
      authRepository.revokeRefreshToken.mockResolvedValue({} as any);
      authRepository.createRefreshToken.mockResolvedValue({} as any);

      const result = await tokenService.refreshTokens('valid-token');

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      // Old token should be revoked
      expect(authRepository.revokeRefreshToken).toHaveBeenCalledWith('token-id-1');
    });
  });

  // ── blacklistAccessToken ──────────────────────────────

  describe('blacklistAccessToken', () => {
    it('should blacklist token with remaining TTL', async () => {
      const futureExp = Math.floor(Date.now() / 1000) + 600; // 10 min from now
      jwtService.decode.mockReturnValue({ exp: futureExp, sub: 'user-uuid-1' });
      redisService.set.mockResolvedValue(undefined);

      await tokenService.blacklistAccessToken('some-jwt');

      expect(redisService.set).toHaveBeenCalledWith(
        'token_bl:some-jwt',
        '1',
        expect.any(Number),
      );
    });

    it('should skip blacklisting for already-expired token', async () => {
      const pastExp = Math.floor(Date.now() / 1000) - 100;
      jwtService.decode.mockReturnValue({ exp: pastExp });

      await tokenService.blacklistAccessToken('expired-jwt');

      expect(redisService.set).not.toHaveBeenCalled();
    });

    it('should handle decode failure gracefully', async () => {
      jwtService.decode.mockImplementation(() => { throw new Error('bad token'); });

      // Should not throw
      await expect(
        tokenService.blacklistAccessToken('garbage'),
      ).resolves.toBeUndefined();
    });
  });

  // ── isAccessTokenBlacklisted ──────────────────────────

  describe('isAccessTokenBlacklisted', () => {
    it('should return true for blacklisted token', async () => {
      redisService.exists.mockResolvedValue(true);

      const result = await tokenService.isAccessTokenBlacklisted('blacklisted-jwt');

      expect(result).toBe(true);
    });

    it('should return false for non-blacklisted token', async () => {
      redisService.exists.mockResolvedValue(false);

      const result = await tokenService.isAccessTokenBlacklisted('valid-jwt');

      expect(result).toBe(false);
    });
  });
});
