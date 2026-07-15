import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../common/database/prisma.service';
import { PaginationDto } from '../../../common/dto/pagination.dto';

@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUser(userId: string, pagination: PaginationDto) {
    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);

    return {
      data,
      meta: {
        page: pagination.page || 1,
        limit: pagination.limit || 10,
        total,
        totalPages: Math.ceil(total / (pagination.limit || 10)),
        hasNextPage: (pagination.page || 1) * (pagination.limit || 10) < total,
        hasPreviousPage: (pagination.page || 1) > 1,
      },
    };
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async create(data: Prisma.NotificationUncheckedCreateInput) {
    return this.prisma.notification.create({ data });
  }

  findById(id: string) {
    return this.prisma.notification.findUnique({ where: { id } });
  }

  findUserDeliveryProfile(userId: string) {
    return this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null, isActive: true },
      include: {
        deviceTokens: {
          where: { isActive: true },
          select: { id: true, token: true, platform: true },
        },
      },
    });
  }

  async appendDeliveryLog(
    notificationId: string,
    log: {
      channel: string;
      status: string;
      providerMessageId?: string;
      error?: string;
      attemptedAt: string;
    },
  ) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return null;
    }

    const data =
      notification.data && typeof notification.data === 'object' && !Array.isArray(notification.data)
        ? (notification.data as Record<string, unknown>)
        : {};
    const deliveryLogs = Array.isArray(data.deliveryLogs) ? data.deliveryLogs : [];

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        data: {
          ...data,
          deliveryLogs: [...deliveryLogs, log],
        } as Prisma.InputJsonValue,
      },
    });
  }
}
