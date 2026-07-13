import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../common/database/prisma.service';

@Injectable()
export class PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByBookingId(bookingId: string) {
    return this.prisma.payment.findMany({ where: { bookingId } });
  }

  // TODO: Implement create, updateStatus, findByRazorpayOrderId
}
