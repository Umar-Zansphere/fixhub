import { Injectable, Logger } from '@nestjs/common';

import { PaymentRepository } from '../repositories/payment.repository';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(private readonly paymentRepository: PaymentRepository) {}

  async createOrder(bookingId: string, userId: string) {
    // TODO: Implement Razorpay order creation
    // 1. Validate booking belongs to user and is in correct status
    // 2. Create Razorpay order via SDK
    // 3. Store order in DB
    // 4. Return order details to client
    this.logger.log(`Creating order for booking: ${bookingId}`);
    throw new Error('Not implemented');
  }

  async verifyPayment(body: any) {
    // TODO: Implement payment verification
    // 1. Verify Razorpay signature
    // 2. Update payment status in DB
    // 3. Update booking status
    // 4. Send notification via BullMQ
    throw new Error('Not implemented');
  }
}
