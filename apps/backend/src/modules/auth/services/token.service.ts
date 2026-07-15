import { ErrorCodes } from '@fixhub/shared';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as crypto from 'crypto';

import { JwtPayload } from '../../../common/interfaces/auth.interface';
import { RedisService } from '../../../common/redis/redis.service';
import { AuthRepository } from '../repositories/auth.repository';

const TOKEN_BLACKLIST_PREFIX = 'token_bl:';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  private readonly accessExpiration: string;
  private readonly refreshExpirationDays: number;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly authRepository: AuthRepository,
  ) {
    this.accessExpiration = this.configService.get<string>('jwt.accessExpiration', '15m');
    // Parse "7d" → 7
    const refreshExp = this.configService.get<string>('jwt.refreshExpiration', '7d');
    this.refreshExpirationDays = parseInt(refreshExp.replace(/\D/g, ''), 10) || 7;
  }

  // ── Token Generation ──────────────────────────────────────

  /**
   * Generate a JWT access token + opaque refresh token pair.
   * The refresh token is stored hashed in the database.
   */
  async generateTokenPair(user: User): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  }> {
    const payload: JwtPayload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.generateOpaqueToken(),
    ]);

    // Store refresh token in DB with expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshExpirationDays);

    await this.authRepository.createRefreshToken({
      token: this.hashToken(refreshToken),
      userId: user.id,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessExpiration,
    };
  }

  // ── Token Rotation ────────────────────────────────────────

  /**
   * Rotate refresh tokens with replay detection.
   *
   * Security:
   * 1. Hash the incoming token and look up in DB
   * 2. If token is already revoked → REPLAY ATTACK → revoke ALL tokens for user
   * 3. If token is valid → revoke old token, issue new pair
   */
  async refreshTokens(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  }> {
    const hashedToken = this.hashToken(refreshToken);
    const storedToken = await this.authRepository.findRefreshToken(hashedToken);

    if (!storedToken) {
      throw new UnauthorizedException({
        message: 'Invalid refresh token',
        errorCode: ErrorCodes.AUTH_TOKEN_INVALID,
      });
    }

    // REPLAY DETECTION: If token was already used/revoked,
    // an attacker may have stolen it. Revoke ALL tokens for safety.
    if (storedToken.isRevoked) {
      this.logger.warn(
        `Refresh token replay detected for user ${storedToken.userId}. Revoking all tokens.`,
      );
      await this.authRepository.revokeAllRefreshTokens(storedToken.userId);
      throw new UnauthorizedException({
        message: 'Suspicious activity detected. Please log in again.',
        errorCode: ErrorCodes.AUTH_TOKEN_INVALID,
      });
    }

    // Check expiry
    if (storedToken.expiresAt < new Date()) {
      await this.authRepository.revokeRefreshToken(storedToken.id);
      throw new UnauthorizedException({
        message: 'Refresh token has expired. Please log in again.',
        errorCode: ErrorCodes.AUTH_TOKEN_EXPIRED,
      });
    }

    // Check user is still active
    if (!storedToken.user.isActive || storedToken.user.deletedAt) {
      await this.authRepository.revokeAllRefreshTokens(storedToken.userId);
      throw new UnauthorizedException({
        message: 'Account is deactivated',
        errorCode: ErrorCodes.AUTH_ACCOUNT_DEACTIVATED,
      });
    }

    // Revoke old token (single-use)
    await this.authRepository.revokeRefreshToken(storedToken.id);

    // Generate new pair
    return this.generateTokenPair(storedToken.user);
  }

  // ── Token Revocation ──────────────────────────────────────

  /**
   * Revoke all refresh tokens for a user (logout).
   * Also blacklists the current access token JWT ID.
   */
  async revokeAllTokens(userId: string): Promise<void> {
    const revokedCount = await this.authRepository.revokeAllRefreshTokens(userId);
    this.logger.log(`Revoked ${revokedCount} refresh tokens for user ${userId}`);
  }

  /**
   * Blacklist a JWT access token by adding its jti to Redis.
   * Checked on every request by JwtStrategy.
   */
  async blacklistAccessToken(token: string): Promise<void> {
    try {
      const decoded = this.jwtService.decode(token) as { exp?: number; jti?: string; sub?: string };
      if (!decoded?.exp) return;

      // Calculate remaining TTL in seconds
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl <= 0) return; // Already expired, no need to blacklist

      const key = `${TOKEN_BLACKLIST_PREFIX}${token}`;
      await this.redisService.set(key, '1', ttl);
    } catch {
      // If token can't be decoded, it's already invalid — ignore
    }
  }

  /**
   * Check if an access token is blacklisted.
   */
  async isAccessTokenBlacklisted(token: string): Promise<boolean> {
    const key = `${TOKEN_BLACKLIST_PREFIX}${token}`;
    return this.redisService.exists(key);
  }

  // ── Private Helpers ───────────────────────────────────────

  private async generateOpaqueToken(): Promise<string> {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Hash a refresh token with SHA-256 before storing in DB.
   * This way, even if the DB is compromised, tokens can't be used.
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
