import { Injectable } from '@nestjs/common';
import {
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
  PaymentTransactionType,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../../../common/database/prisma.service';
import { PaymentHistoryQueryDto } from '../dto';

type PrismaTx = Prisma.TransactionClient;

@Injectable()
export class PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  findBookingForPayment(bookingId: string) {
    return this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        payment: true,
      },
    });
  }

  findPaymentByBookingId(bookingId: string) {
    return this.prisma.payment.findUnique({
      where: { bookingId },
      include: { booking: true, transactions: { orderBy: { createdAt: 'desc' } } },
    });
  }

  findPaymentByOrderId(orderId: string) {
    return this.prisma.payment.findUnique({
      where: { razorpayOrderId: orderId },
      include: { booking: true, transactions: { orderBy: { createdAt: 'desc' } } },
    });
  }

  findPaymentByRazorpayPaymentId(razorpayPaymentId: string) {
    return this.prisma.payment.findUnique({
      where: { razorpayPaymentId },
      include: { booking: true, transactions: { orderBy: { createdAt: 'desc' } } },
    });
  }

  findPaymentById(paymentId: string) {
    return this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: true, transactions: { orderBy: { createdAt: 'desc' } } },
    });
  }

  upsertOrder(
    tx: PrismaTx,
    params: {
      bookingId: string;
      amount: number;
      currency: string;
      razorpayOrderId: string;
    },
  ) {
    return tx.payment.upsert({
      where: { bookingId: params.bookingId },
      create: {
        bookingId: params.bookingId,
        amount: params.amount,
        currency: params.currency,
        razorpayOrderId: params.razorpayOrderId,
        status: PaymentStatus.PENDING,
      },
      update: {
        amount: params.amount,
        currency: params.currency,
        razorpayOrderId: params.razorpayOrderId,
        status: PaymentStatus.PENDING,
        failureReason: null,
      },
    });
  }

  markCaptured(
    tx: PrismaTx,
    paymentId: string,
    params: {
      razorpayPaymentId: string;
      razorpaySignature?: string;
      method?: PaymentMethod;
    },
  ) {
    return tx.payment.update({
      where: { id: paymentId },
      data: {
        razorpayPaymentId: params.razorpayPaymentId,
        razorpaySignature: params.razorpaySignature,
        method: params.method,
        status: PaymentStatus.CAPTURED,
        paidAt: new Date(),
        failureReason: null,
      },
    });
  }

  markFailed(tx: PrismaTx, paymentId: string, failureReason: string) {
    return tx.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.FAILED,
        failureReason,
      },
    });
  }

  markRefunded(
    tx: PrismaTx,
    paymentId: string,
    status: PaymentStatus,
  ) {
    return tx.payment.update({
      where: { id: paymentId },
      data: {
        status,
        refundedAt: new Date(),
      },
    });
  }

  updateBookingStatus(tx: PrismaTx, bookingId: string, status: BookingStatus) {
    return tx.booking.update({
      where: { id: bookingId },
      data: { status },
    });
  }

  createTransaction(
    tx: PrismaTx,
    params: {
      paymentId: string;
      type: PaymentTransactionType;
      amount: number;
      status: string;
      razorpayEventId?: string;
      gatewayResponse?: Prisma.InputJsonValue;
    },
  ) {
    return tx.paymentTransaction.create({
      data: {
        paymentId: params.paymentId,
        type: params.type,
        amount: params.amount,
        status: params.status,
        razorpayEventId: params.razorpayEventId,
        gatewayResponse: params.gatewayResponse,
      },
    });
  }

  findTransactionByEventId(eventId: string) {
    return this.prisma.paymentTransaction.findUnique({
      where: { razorpayEventId: eventId },
    });
  }

  findStuckPayments(cutoffTime: Date) {
    return this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.PENDING,
        createdAt: { lt: cutoffTime },
        razorpayOrderId: { not: null },
      },
    });
  }

  async historyForUser(userId: string, query: PaymentHistoryQueryDto) {
    const where: Prisma.PaymentWhereInput = {
      booking: {
        customer: { userId },
      },
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          booking: {
            select: {
              id: true,
              bookingNumber: true,
              status: true,
              scheduledDate: true,
              scheduledSlot: true,
            },
          },
          transactions: { orderBy: { createdAt: 'desc' }, take: 5 },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      items,
      meta: {
        page: query.page ?? 1,
        limit: query.limit ?? 10,
        total,
        totalPages: Math.ceil(total / (query.limit ?? 10)),
      },
    };
  }

  transaction<T>(fn: (tx: PrismaTx) => Promise<T>) {
    return this.prisma.$transaction(fn);
  }
}
