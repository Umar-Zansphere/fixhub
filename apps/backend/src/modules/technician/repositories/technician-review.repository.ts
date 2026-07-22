import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../common/database/prisma.service';
import { PaginationDto } from '../../../common/dto/pagination.dto';

@Injectable()
export class TechnicianReviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listReviews(technicianId: string, pagination: PaginationDto) {
    const where = { technicianId };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            include: {
              user: { select: { id: true, name: true } },
            },
          },
          booking: {
            select: {
              id: true,
              bookingNumber: true,
              scheduledDate: true,
              subService: {
                select: { id: true, name: true, category: { select: { id: true, name: true } } },
              },
            },
          },
        },
      }),
      this.prisma.review.count({ where }),
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

  async getRatingsSummary(technicianId: string) {
    const [aggregate, distribution] = await this.prisma.$transaction([
      this.prisma.review.aggregate({
        where: { technicianId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      this.prisma.review.groupBy({
        by: ['rating'],
        where: { technicianId },
        _count: true,
        orderBy: { rating: 'desc' },
      }),
    ]);

    // Build 1-5 distribution
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const row of distribution) {
      const count = typeof row._count === 'number' ? row._count : 0;
      ratingDistribution[row.rating] = count;
    }

    return {
      averageRating: aggregate._avg.rating ? Number(aggregate._avg.rating.toFixed(2)) : 0,
      totalReviews: aggregate._count.rating,
      distribution: ratingDistribution,
    };
  }
}
