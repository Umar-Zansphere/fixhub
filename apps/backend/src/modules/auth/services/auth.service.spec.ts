import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';

import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { TokenService } from './token.service';
import { AuthRepository } from '../repositories/auth.repository';

describe('AuthService', () => {
  let authService: AuthService;
  let otpService: jest.Mocked<OtpService>;
  let tokenService: jest.Mocked<TokenService>;
  let authRepository: jest.Mocked<AuthRepository>;

  const mockUser = {
    id: 'user-uuid-1',
    phone: '+919876543210',
    name: null,
    email: null,
    password: null,
    role: Role.CUSTOMER,
    isActive: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTokenPair = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: '15m',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: OtpService,
          useValue: {
            generateAndStore: jest.fn(),
            verify: jest.fn(),
            getCooldownRemaining: jest.fn(),
            cleanup: jest.fn(),
          },
        },
        {
          provide: TokenService,
          useValue: {
            generateTokenPair: jest.fn(),
            refreshTokens: jest.fn(),
            revokeAllTokens: jest.fn(),
            blacklistAccessToken: jest.fn(),
          },
        },
        {
          provide: AuthRepository,
          useValue: {
            findOrCreateUser: jest.fn(),
            findUserById: jest.fn(),
            deactivateUserDeviceTokens: jest.fn(),
            upsertDeviceToken: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    otpService = module.get(OtpService);
    tokenService = module.get(TokenService);
    authRepository = module.get(AuthRepository);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  // ── sendOtp ─────────────────────────────────────────────

  describe('sendOtp', () => {
    it('should send OTP successfully', async () => {
      otpService.generateAndStore.mockResolvedValue({
        otp: '123456',
        expiresInSeconds: 300,
        isResend: false,
      });

      const result = await authService.sendOtp({ phone: '+919876543210' });

      expect(result.message).toBe('OTP sent successfully');
      expect(result.expiresInSeconds).toBe(300);
      expect(otpService.generateAndStore).toHaveBeenCalledWith('+919876543210');
    });

    it('should return cooldown message when OTP was recently sent', async () => {
      otpService.generateAndStore.mockResolvedValue({
        otp: '',
        expiresInSeconds: 45,
        isResend: false,
      });
      otpService.getCooldownRemaining.mockResolvedValue(45);

      const result = await authService.sendOtp({ phone: '+919876543210' });

      expect(result.message).toContain('wait');
      expect(result.cooldownSeconds).toBe(45);
    });
  });

  // ── verifyOtp ───────────────────────────────────────────

  describe('verifyOtp', () => {
    it('should verify OTP and return tokens for existing user', async () => {
      otpService.verify.mockResolvedValue({ valid: true });
      authRepository.findOrCreateUser.mockResolvedValue({
        user: mockUser,
        isNewUser: false,
      });
      tokenService.generateTokenPair.mockResolvedValue(mockTokenPair);

      const result = await authService.verifyOtp({
        phone: '+919876543210',
        otp: '123456',
        role: Role.CUSTOMER,
      });

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
      expect(result.isNewUser).toBe(false);
      expect(result.user.id).toBe('user-uuid-1');
      expect(result.user.role).toBe(Role.CUSTOMER);
    });

    it('should create new user on first login', async () => {
      otpService.verify.mockResolvedValue({ valid: true });
      authRepository.findOrCreateUser.mockResolvedValue({
        user: mockUser,
        isNewUser: true,
      });
      tokenService.generateTokenPair.mockResolvedValue(mockTokenPair);

      const result = await authService.verifyOtp({
        phone: '+919876543210',
        otp: '123456',
        role: Role.CUSTOMER,
      });

      expect(result.isNewUser).toBe(true);
    });

    it('should reject admin role for OTP login', async () => {
      await expect(
        authService.verifyOtp({
          phone: '+919876543210',
          otp: '123456',
          role: Role.ADMIN,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw UnauthorizedException for expired OTP', async () => {
      otpService.verify.mockResolvedValue({
        valid: false,
        reason: 'EXPIRED',
        remainingAttempts: 4,
      });

      await expect(
        authService.verifyOtp({
          phone: '+919876543210',
          otp: '123456',
          role: Role.CUSTOMER,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid OTP', async () => {
      otpService.verify.mockResolvedValue({
        valid: false,
        reason: 'INVALID',
        remainingAttempts: 3,
      });

      await expect(
        authService.verifyOtp({
          phone: '+919876543210',
          otp: '999999',
          role: Role.CUSTOMER,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException for max attempts exceeded', async () => {
      otpService.verify.mockResolvedValue({
        valid: false,
        reason: 'MAX_ATTEMPTS',
        remainingAttempts: 0,
      });

      await expect(
        authService.verifyOtp({
          phone: '+919876543210',
          otp: '000000',
          role: Role.CUSTOMER,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject deactivated user', async () => {
      otpService.verify.mockResolvedValue({ valid: true });
      authRepository.findOrCreateUser.mockResolvedValue({
        user: { ...mockUser, isActive: false },
        isNewUser: false,
      });

      await expect(
        authService.verifyOtp({
          phone: '+919876543210',
          otp: '123456',
          role: Role.CUSTOMER,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ── refreshTokens ─────────────────────────────────────

  describe('refreshTokens', () => {
    it('should delegate to tokenService', async () => {
      tokenService.refreshTokens.mockResolvedValue(mockTokenPair);

      const result = await authService.refreshTokens('some-refresh-token');

      expect(result).toEqual(mockTokenPair);
      expect(tokenService.refreshTokens).toHaveBeenCalledWith('some-refresh-token');
    });
  });

  // ── logout ────────────────────────────────────────────

  describe('logout', () => {
    it('should revoke all tokens, blacklist access token, and deactivate devices', async () => {
      tokenService.revokeAllTokens.mockResolvedValue(undefined);
      tokenService.blacklistAccessToken.mockResolvedValue(undefined);
      authRepository.deactivateUserDeviceTokens.mockResolvedValue({ count: 1 } as any);

      const result = await authService.logout('user-uuid-1', 'access-token');

      expect(result.message).toBe('Logged out successfully');
      expect(tokenService.revokeAllTokens).toHaveBeenCalledWith('user-uuid-1');
      expect(tokenService.blacklistAccessToken).toHaveBeenCalledWith('access-token');
      expect(authRepository.deactivateUserDeviceTokens).toHaveBeenCalledWith('user-uuid-1');
    });

    it('should handle logout without access token', async () => {
      tokenService.revokeAllTokens.mockResolvedValue(undefined);
      authRepository.deactivateUserDeviceTokens.mockResolvedValue({ count: 0 } as any);

      const result = await authService.logout('user-uuid-1');

      expect(result.message).toBe('Logged out successfully');
      expect(tokenService.blacklistAccessToken).not.toHaveBeenCalled();
    });
  });

  // ── getMe ─────────────────────────────────────────────

  describe('getMe', () => {
    it('should return user profile with customer data', async () => {
      authRepository.findUserById.mockResolvedValue({
        ...mockUser,
        customer: {
          id: 'customer-uuid-1',
          userId: mockUser.id,
          profilePictureUrl: null,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        technician: null,
      } as any);

      const result = await authService.getMe('user-uuid-1');

      expect(result.id).toBe('user-uuid-1');
      expect(result.role).toBe(Role.CUSTOMER);
      expect(result.profile).toBeDefined();
      expect(result.profile!.id).toBe('customer-uuid-1');
    });

    it('should throw if user not found', async () => {
      authRepository.findUserById.mockResolvedValue(null);

      await expect(authService.getMe('nonexistent-id')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if user is deactivated', async () => {
      authRepository.findUserById.mockResolvedValue({
        ...mockUser,
        isActive: false,
        customer: null,
        technician: null,
      } as any);

      await expect(authService.getMe('user-uuid-1')).rejects.toThrow(ForbiddenException);
    });
  });
});
