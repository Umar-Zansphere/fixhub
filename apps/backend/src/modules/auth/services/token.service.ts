import { ErrorCodes } from '@fixhub/shared';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as crypto from 'crypto';

import { JwtPayload } from '../../../common/interfaces/auth.interface';
import { AuthRepository } from '../repositories/auth.repository';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly authRepository: AuthRepository,
  ) {}

  async generateTokenPair(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.generateRefreshToken(),
    ]);

    // Store refresh token in DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.authRepository.createRefreshToken({
      token: refreshToken,
      userId: user.id,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }

  async refreshTokens(refreshToken: string) {
    const storedToken = await this.authRepository.findRefreshToken(refreshToken);

    if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException({
        message: 'Invalid or expired refresh token',
        errorCode: ErrorCodes.AUTH_TOKEN_INVALID,
      });
    }

    // Revoke old token
    await this.authRepository.revokeRefreshToken(storedToken.id);

    // Generate new pair
    return this.generateTokenPair(storedToken.user);
  }

  async revokeAllTokens(userId: string) {
    await this.authRepository.revokeAllRefreshTokens(userId);
  }

  private async generateRefreshToken(): Promise<string> {
    return crypto.randomBytes(64).toString('hex');
  }
}
