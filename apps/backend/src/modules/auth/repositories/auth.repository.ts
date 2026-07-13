import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';

import { PrismaService } from '../../../common/database/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserByPhone(phone: string) {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  async findOrCreateUser(phone: string, role: Role) {
    let user = await this.findUserByPhone(phone);

    if (!user) {
      user = await this.prisma.user.create({
        data: { phone, role },
      });

      // Create associated profile
      if (role === Role.CUSTOMER) {
        await this.prisma.customer.create({ data: { userId: user.id } });
      } else if (role === Role.TECHNICIAN) {
        await this.prisma.technician.create({ data: { userId: user.id } });
      }
    }

    return user;
  }

  async createRefreshToken(data: { token: string; userId: string; expiresAt: Date }) {
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

  async revokeAllRefreshTokens(userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }
}
