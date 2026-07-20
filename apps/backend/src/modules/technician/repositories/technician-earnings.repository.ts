import { Injectable } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';

import { PrismaService } from '../../../common/database/prisma.service';
import { PaginationDto } from '../../../common/dto/pagination.dto';

@Injectable()
export class TechnicianEarningsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getEarningsSummary(technicianId: string, dateFrom?: string, dateTo?: string) {
    const dateFilter = this.buildDateFilter(dateFrom, dateTo);

    const aggregate = await this.prisma.booking.aggregate({
      where: {
        technicianId,
        status: BookingStatus.COMPLETED,
        ...dateFilter,
      },
      _sum: { totalAmount: true },
      _count: { id: true },
      _avg: { totalAmount: true },
    });

    return {
      totalEarnings: aggregate._sum.totalAmount ? Number(aggregate._sum.totalAmount) : 0,
      completedJobs: aggregate._count.id,
      averagePerJob: aggregate._avg.totalAmount ? Number(Number(aggregate._avg.totalAmount).toFixed(2)) : 0,
    };
  }

  async listCompletedBookings(
    technicianId: string,
    pagination: PaginationDto,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const dateFilter = this.buildDateFilter(dateFrom, dateTo);
    const where = {
      technicianId,
      status: BookingStatus.COMPLETED,
      ...dateFilter,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { completedAt: 'desc' },
        select: {
          id: true,
          bookingNumber: true,
          totalAmount: true,
          scheduledDate: true,
          completedAt: true,
          subService: {
            select: {
              id: true,
              name: true,
              category: { select: { id: true, name: true } },
            },
          },
          customer: {
            include: {
              user: { select: { id: true, name: true } },
            },
          },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  private buildDateFilter(dateFrom?: string, dateTo?: string) {
    if (!dateFrom && !dateTo) return {};

    return {
      completedAt: {
        ...(dateFrom && { gte: new Date(`${dateFrom}T00:00:00.000Z`) }),
        ...(dateTo && { lte: new Date(`${dateTo}T23:59:59.999Z`) }),
      },
    };
  }
}
