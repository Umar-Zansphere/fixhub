import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../common/database/prisma.service';

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

  // TODO: Implement CRUD methods for categories, service areas, technician management
}
