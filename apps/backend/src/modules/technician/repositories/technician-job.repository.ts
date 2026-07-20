import { Injectable } from '@nestjs/common';
import { BookingStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../../../common/database/prisma.service';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { JobQueryDto } from '../dto';

/** Active job statuses — technician has accepted and is actively working */
const ACTIVE_JOB_STATUSES = [
  BookingStatus.ACCEPTED,
  BookingStatus.EN_ROUTE,
  BookingStatus.ARRIVED,
  BookingStatus.IN_PROGRESS,
];

/** Terminal job statuses — for history queries */
const TERMINAL_JOB_STATUSES = [
  BookingStatus.COMPLETED,
  BookingStatus.CANCELLED,
  BookingStatus.FAILED,
];

@Injectable()
export class TechnicianJobRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listJobs(technicianId: string, query: JobQueryDto) {
    const where = this.buildJobWhere(technicianId, query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: this.jobOrderBy(query),
        include: this.jobListInclude(),
      }),
      this.prisma.booking.count({ where }),
    ]);

    return this.paginate(items, total, query);
  }

  async listJobHistory(technicianId: string, query: JobQueryDto) {
    const where: Prisma.BookingWhereInput = {
      ...this.buildJobWhere(technicianId, query),
      status: { in: TERMINAL_JOB_STATUSES },
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: this.jobOrderBy(query),
        include: this.jobListInclude(),
      }),
      this.prisma.booking.count({ where }),
    ]);

    return this.paginate(items, total, query);
  }

  async findCurrentJob(technicianId: string) {
    return this.prisma.booking.findFirst({
      where: {
        technicianId,
        status: { in: ACTIVE_JOB_STATUSES },
      },
      orderBy: { updatedAt: 'desc' },
      include: this.jobDetailInclude(),
    });
  }

  async findJobById(bookingId: string) {
    return this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: this.jobDetailInclude(),
    });
  }

  async findJobForAction(bookingId: string, technicianId: string) {
    return this.prisma.booking.findFirst({
      where: {
        id: bookingId,
        technicianId,
      },
      include: {
        customer: { include: { user: { select: { name: true, phone: true } } } },
        technician: true,
        subService: { include: { category: true } },
        address: true,
      },
    });
  }

  private buildJobWhere(technicianId: string, query: JobQueryDto): Prisma.BookingWhereInput {
    return {
      technicianId,
      ...(query.status && { status: query.status }),
      ...(query.subServiceId && { subServiceId: query.subServiceId }),
      ...((query.dateFrom || query.dateTo) && {
        scheduledDate: {
          ...(query.dateFrom && { gte: new Date(`${query.dateFrom}T00:00:00.000Z`) }),
          ...(query.dateTo && { lte: new Date(`${query.dateTo}T23:59:59.999Z`) }),
        },
      }),
      ...(query.search && {
        OR: [
          { bookingNumber: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
          { customer: { user: { name: { contains: query.search, mode: 'insensitive' } } } },
          { subService: { name: { contains: query.search, mode: 'insensitive' } } },
          { address: { city: { contains: query.search, mode: 'insensitive' } } },
        ],
      }),
    } as Prisma.BookingWhereInput;
  }

  private jobOrderBy(query: JobQueryDto): Prisma.BookingOrderByWithRelationInput {
    const allowed = new Set([
      'scheduledDate', 'status', 'totalAmount', 'createdAt', 'updatedAt', 'completedAt',
    ]);
    const sortBy = allowed.has(query.sortBy ?? '') ? query.sortBy! : 'createdAt';
    return { [sortBy]: query.sortOrder ?? 'desc' };
  }

  private jobListInclude(): Prisma.BookingInclude {
    return {
      customer: { include: { user: { select: { id: true, name: true, phone: true } } } },
      subService: {
        select: {
          id: true,
          name: true,
          basePrice: true,
          estimatedDurationMins: true,
          category: { select: { id: true, name: true, slug: true } },
        },
      },
      address: {
        select: {
          id: true,
          label: true,
          line1: true,
          line2: true,
          landmark: true,
          city: true,
          state: true,
          pincode: true,
          latitude: true,
          longitude: true,
        },
      },
    };
  }

  private jobDetailInclude(): Prisma.BookingInclude {
    return {
      customer: { include: { user: { select: { id: true, name: true, phone: true, email: true } } } },
      subService: { include: { category: true } },
      address: true,
      timeline: { orderBy: { createdAt: 'desc' } },
      media: true,
      review: true,
    };
  }

  private paginate<T>(items: T[], total: number, query: PaginationDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

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
}
