import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../common/database/prisma.service';
import { PaginationDto } from '../../../common/dto/pagination.dto';

@Injectable()
export class BookingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUser(userId: string, role: string, pagination: PaginationDto) {
    const where = role === 'CUSTOMER' ? { customerId: userId } : { technician: { userId } };

    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { [pagination.sortBy || 'createdAt']: pagination.sortOrder || 'desc' },
        include: {
          subService: { include: { category: true } },
          address: true,
          technician: { include: { user: { select: { name: true, phone: true } } } },
        },
      }),
      this.prisma.booking.count({ where }),
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

  async findById(id: string) {
    return this.prisma.booking.findUnique({
      where: { id },
      include: {
        customer: { include: { user: { select: { name: true, phone: true } } } },
        technician: { include: { user: { select: { name: true, phone: true } } } },
        subService: { include: { category: true } },
        address: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
        payments: true,
        media: true,
        review: true,
      },
    });
  }

  // TODO: Implement create, update status, count for booking number generation
}
