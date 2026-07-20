import { Injectable } from '@nestjs/common';
import { Prisma, VerificationStatus } from '@prisma/client';

import { PrismaService } from '../../../common/database/prisma.service';
import { CustomerQueryDto, TechnicianQueryDto } from '../dto/admin.dto';

@Injectable()
export class AdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const [totalBookings, totalCustomers, totalTechnicians, activeBookings] = await Promise.all([
      this.prisma.booking.count(),
      this.prisma.customer.count(),
      this.prisma.technician.count(),
      this.prisma.booking.count({
        where: { status: { in: ['PENDING_PAYMENT', 'CONFIRMED', 'ASSIGNED', 'IN_PROGRESS'] } },
      }),
    ]);

    return { totalBookings, totalCustomers, totalTechnicians, activeBookings };
  }

  async listCustomers(query: CustomerQueryDto) {
    const where: Prisma.CustomerWhereInput = {
      ...(query.isActive !== undefined && { user: { isActive: query.isActive } }),
      ...(query.search && {
        user: {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { email: { contains: query.search, mode: 'insensitive' } },
            { phone: { contains: query.search } },
          ],
        },
      }),
    };

    const sortBy = this.customerSortField(query.sortBy);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: sortBy === 'createdAt' || sortBy === 'updatedAt' ? { [sortBy]: query.sortOrder ?? 'desc' } : { user: { [sortBy]: query.sortOrder ?? 'asc' } },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, isActive: true, createdAt: true } },
          _count: { select: { addresses: true, bookings: true } },
        },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return this.paginate(items, total, query);
  }

  async getCustomerDetails(id: string) {
    return this.prisma.customer.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, isActive: true, createdAt: true, updatedAt: true } },
        addresses: true,
        bookings: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { subService: { include: { category: true } } },
        },
        _count: { select: { bookings: true } },
      },
    });
  }

  async listTechnicians(query: TechnicianQueryDto) {
    const where: Prisma.TechnicianWhereInput = {
      ...(query.verificationStatus && { verificationStatus: query.verificationStatus }),
      ...(query.isAvailable !== undefined && { isAvailable: query.isAvailable }),
      ...(query.isActive !== undefined && { user: { isActive: query.isActive } }),
      ...(query.search && {
        user: {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { email: { contains: query.search, mode: 'insensitive' } },
            { phone: { contains: query.search } },
          ],
        },
      }),
    };

    const sortBy = this.technicianSortField(query.sortBy);
    
    // Sort logic for nested user fields vs technician fields
    let orderBy: Prisma.TechnicianOrderByWithRelationInput = {};
    if (sortBy === 'name' || sortBy === 'email') {
      orderBy = { user: { [sortBy]: query.sortOrder ?? 'asc' } };
    } else {
      orderBy = { [sortBy]: query.sortOrder ?? 'desc' };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.technician.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, isActive: true, createdAt: true } },
          _count: { select: { bookings: true } },
        },
      }),
      this.prisma.technician.count({ where }),
    ]);

    return this.paginate(items, total, query);
  }

  async getTechnicianDetails(id: string) {
    return this.prisma.technician.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, isActive: true, createdAt: true, updatedAt: true } },
        specializations: { include: { subService: { include: { category: true } } } },
        serviceAreas: { include: { serviceArea: true } },
        documents: true,
        _count: { select: { bookings: true, reviews: true } },
      },
    });
  }

  async updateUserStatus(userId: string, isActive: boolean) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: { id: true, isActive: true, role: true },
    });
  }

  async verifyTechnician(id: string, status: VerificationStatus, rejectionNote?: string) {
    return this.prisma.technician.update({
      where: { id },
      data: {
        verificationStatus: status,
        ...(status === VerificationStatus.REJECTED && rejectionNote ? { rejectionNote } : { rejectionNote: null }),
        ...(status === VerificationStatus.VERIFIED && { isAvailable: false }), // Reset availability on status change
      },
      include: { user: { select: { id: true, name: true, phone: true, isActive: true } } },
    });
  }

  private customerSortField(sortBy?: string) {
    const allowed = new Set(['name', 'email', 'createdAt', 'updatedAt']);
    return allowed.has(sortBy ?? '') ? sortBy! : 'createdAt';
  }

  private technicianSortField(sortBy?: string) {
    const allowed = new Set(['name', 'email', 'createdAt', 'rating', 'totalJobs', 'verificationStatus']);
    return allowed.has(sortBy ?? '') ? sortBy! : 'createdAt';
  }

  private paginate<T>(items: T[], total: number, query: any) {
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
