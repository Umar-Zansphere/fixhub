import { Injectable } from '@nestjs/common';
import { BookingStatus, Prisma, Role } from '@prisma/client';

import { PrismaService } from '../../../common/database/prisma.service';

@Injectable()
export class ReportingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getRevenueMetrics(where: Prisma.BookingWhereInput) {
    const revenue = await this.prisma.booking.aggregate({
      where: { ...where, status: BookingStatus.COMPLETED },
      _sum: { totalAmount: true },
    });
    return revenue._sum.totalAmount ?? 0;
  }

  async getBookingMetrics(where: Prisma.BookingWhereInput) {
    const [total, byStatus, bookingsWithCategory] = await Promise.all([
      this.prisma.booking.count({ where }),
      this.prisma.booking.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      this.prisma.booking.findMany({
        where,
        select: { subService: { select: { categoryId: true, category: { select: { name: true } } } } },
      }),
    ]);

    const categoryCounts: Record<string, { name: string; count: number }> = {};
    for (const b of bookingsWithCategory) {
      const id = b.subService.categoryId;
      const name = b.subService.category.name;
      if (!categoryCounts[id]) {
        categoryCounts[id] = { name, count: 0 };
      }
      categoryCounts[id].count++;
    }

    const popularCategories = Object.values(categoryCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return { total, byStatus, popularCategories };
  }

  async getCustomerMetrics(whereUser: Prisma.UserWhereInput, whereCustomer: Prisma.CustomerWhereInput) {
    const [totalUsers, activeCustomers] = await Promise.all([
      this.prisma.user.count({ where: { ...whereUser, role: Role.CUSTOMER } }),
      this.prisma.customer.count({ where: whereCustomer }),
    ]);
    
    // Calculate new vs returning based on bookings
    const customerBookings = await this.prisma.booking.groupBy({
      by: ['customerId'],
      where: { customer: whereCustomer },
      _count: true,
    });

    let returning = 0;
    let newCustomers = 0;
    for (const cb of customerBookings) {
      if (cb._count > 1) {
        returning++;
      } else {
        newCustomers++;
      }
    }

    return { totalUsers, activeCustomers, newCustomers, returningCustomers: returning };
  }

  async getTechnicianMetrics(where: Prisma.TechnicianWhereInput) {
    const [total, byVerification, topPerformers] = await Promise.all([
      this.prisma.technician.count({ where }),
      this.prisma.technician.groupBy({
        by: ['verificationStatus'],
        where,
        _count: true,
      }),
      this.prisma.technician.findMany({
        where,
        select: {
          id: true,
          rating: true,
          totalJobs: true,
          user: { select: { name: true } },
        },
        orderBy: [{ rating: 'desc' }, { totalJobs: 'desc' }],
        take: 10,
      }),
    ]);

    return { total, byVerification, topPerformers };
  }

  async getPaymentMetrics(where: Prisma.PaymentWhereInput) {
    const [byStatus, totalAmount] = await Promise.all([
      this.prisma.payment.groupBy({
        by: ['status'],
        where,
        _count: true,
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { ...where, status: 'CAPTURED' },
        _sum: { amount: true },
      }),
    ]);

    return { byStatus, totalCaptured: totalAmount._sum.amount ?? 0 };
  }

  async getCancellationMetrics(where: Prisma.BookingWhereInput) {
    const cancellations = await this.prisma.booking.findMany({
      where: { ...where, status: BookingStatus.CANCELLED },
      select: { cancelReason: true },
    });

    const byReason: Record<string, number> = {};
    for (const c of cancellations) {
      const reason = c.cancelReason || 'Unknown';
      byReason[reason] = (byReason[reason] || 0) + 1;
    }

    return {
      totalCancellations: cancellations.length,
      byReason,
    };
  }

  async getGrowthMetrics(startDate: Date, endDate: Date) {
    // We'll approximate monthly growth by fetching bookings and grouping them by month
    // Prisma doesn't natively group by date parts easily across all databases, so we fetch and group in memory
    const bookings = await this.prisma.booking.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      select: { createdAt: true, totalAmount: true },
    });

    const monthlyGrowth: Record<string, { bookings: number; revenue: number }> = {};
    
    for (const b of bookings) {
      const month = `${b.createdAt.getFullYear()}-${String(b.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyGrowth[month]) {
        monthlyGrowth[month] = { bookings: 0, revenue: 0 };
      }
      monthlyGrowth[month].bookings++;
      monthlyGrowth[month].revenue += Number(b.totalAmount);
    }

    return Object.entries(monthlyGrowth)
      .map(([month, stats]) => ({ month, ...stats }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }
}
