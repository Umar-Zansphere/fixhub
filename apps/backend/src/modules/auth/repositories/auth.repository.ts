import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ErrorCodes } from '@fixhub/shared';
import { DevicePlatform, Role } from '@prisma/client';

import { PrismaService } from '../../../common/database/prisma.service';

@Injectable()
export class AuthRepository {
  private readonly logger = new Logger(AuthRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── User Operations ───────────────────────────────────────

  async findUserByPhone(phone: string) {
    return this.prisma.user.findUnique({
      where: { phone, deletedAt: null },
    });
  }

  async findUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      include: {
        customer: true,
        technician: true,
      },
    });
  }

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email, deletedAt: null },
    });
  }

  /**
   * Find existing user by phone or create a new one with the
   * associated role profile (Customer or Technician).
   * Uses a transaction to guarantee atomicity.
   */
  async findOrCreateUser(phone: string, role: Role) {
    const existingUser = await this.findUserByPhone(phone);

    if (existingUser) {
      if (existingUser.role !== role) {
        throw new ConflictException({
          message: `User is already registered as ${existingUser.role}. Please login with correct role.`,
          errorCode: ErrorCodes.AUTH_UNAUTHORIZED,
        });
      }
      return { user: existingUser, isNewUser: false };
    }

    // Create user + role profile in a single transaction
    const newUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { phone, role },
      });

      if (role === Role.CUSTOMER) {
        await tx.customer.create({ data: { userId: user.id } });
      } else if (role === Role.TECHNICIAN) {
        await tx.technician.create({ data: { userId: user.id } });
      }

      return user;
    });

    this.logger.log(`New ${role} user created: ${newUser.id}`);
    return { user: newUser, isNewUser: true };
  }

  // ── Refresh Token Operations ──────────────────────────────

  async createRefreshToken(data: {
    token: string;
    userId: string;
    expiresAt: Date;
  }) {
    return this.prisma.refreshToken.create({ data });
  }

  async findRefreshToken(token: string) {
    return this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  async revokeRefreshToken(id: string) {
    return this.prisma.refreshToken.update({
      where: { id },
      data: { isRevoked: true },
    });
  }

  /**
   * Revoke ALL active refresh tokens for a user.
   * Used on logout and on replay-attack detection.
   */
  async revokeAllRefreshTokens(userId: string) {
    const result = await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
    return result.count;
  }

  /**
   * Cleanup expired tokens. Called by a scheduled cron job.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async deleteExpiredTokens() {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isRevoked: true },
        ],
      },
    });
    return result.count;
  }

  // ── Device Token Operations ───────────────────────────────

  async upsertDeviceToken(
    userId: string,
    token: string,
    platform: DevicePlatform,
  ) {
    // Deactivate this token on any other user (device transfers)
    await this.prisma.deviceToken.updateMany({
      where: { token, userId: { not: userId } },
      data: { isActive: false },
    });

    // Upsert for current user
    const existing = await this.prisma.deviceToken.findUnique({
      where: { token },
    });

    if (existing) {
      return this.prisma.deviceToken.update({
        where: { token },
        data: { userId, platform, isActive: true },
      });
    }

    return this.prisma.deviceToken.create({
      data: { userId, token, platform, isActive: true },
    });
  }

  async deactivateUserDeviceTokens(userId: string) {
    return this.prisma.deviceToken.updateMany({
      where: { userId },
      data: { isActive: false },
    });
  }
}
