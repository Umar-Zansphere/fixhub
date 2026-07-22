import { ErrorCodes } from '@fixhub/shared';
import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  BookingStatus,
  NotificationType,
  PaymentMethod,
  PaymentStatus,
  PaymentTransactionType,
  Prisma,
} from '@prisma/client';
import { Queue } from 'bullmq';

import { QUEUE_NAMES } from '../../../common/queue/queue.constants';
import { RedisService } from '../../../common/redis/redis.service';
import { BookingDispatchService } from '../../booking/services/booking-dispatch.service';
import { NotificationService } from '../../notification/services/notification.service';
import {
  CreatePaymentOrderDto,
  PaymentHistoryQueryDto,
  RefundPaymentDto,
  VerifyPaymentDto,
} from '../dto';
import { PaymentRepository } from '../repositories/payment.repository';
import { RazorpayGatewayService } from './razorpay-gateway.service';

const CURRENCY = 'INR';
const IDEMPOTENCY_TTL_SECONDS = 10 * 60;

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly razorpayGateway: RazorpayGatewayService,
    private readonly redisService: RedisService,
    private readonly dispatchService: BookingDispatchService,
    private readonly notificationService: NotificationService,
    @InjectQueue(QUEUE_NAMES.PAYMENT_WEBHOOK)
    private readonly webhookQueue: Queue,
  ) {}

  async createOrder(bookingId: string, userId: string, dto: CreatePaymentOrderDto = {}) {
    const idempotencyKey = dto.idempotencyKey
      ? `payment:order:${userId}:${bookingId}:${dto.idempotencyKey}`
      : undefined;
    const cached = idempotencyKey ? await this.getIdempotentResult(idempotencyKey) : null;

    if (cached) {
      return cached;
    }

    const booking = await this.paymentRepository.findBookingForPayment(bookingId);

    if (!booking) {
      throw new NotFoundException({
        message: 'Booking not found',
        errorCode: ErrorCodes.BOOKING_NOT_FOUND,
      });
    }

    if (booking.customer.userId !== userId) {
      throw new ForbiddenException({
        message: 'Cannot create payment order for another customer booking',
        errorCode: ErrorCodes.AUTH_FORBIDDEN,
      });
    }

    const payableStatuses: BookingStatus[] = [BookingStatus.CONFIRMED, BookingStatus.PENDING_PAYMENT];

    if (!payableStatuses.includes(booking.status)) {
      throw new BadRequestException({
        message: 'Payment order can be created only for confirmed bookings',
        errorCode: ErrorCodes.BOOKING_INVALID_STATUS,
      });
    }

    const amount = Number(booking.totalAmount);
    const amountInPaise = this.toPaise(amount);
    const razorpayOrder = await this.razorpayGateway.createOrder({
      amountInPaise,
      currency: CURRENCY,
      receipt: booking.bookingNumber,
      notes: { bookingId, bookingNumber: booking.bookingNumber },
    });

    const payment = await this.paymentRepository.transaction(async (tx) => {
      const saved = await this.paymentRepository.upsertOrder(tx, {
        bookingId,
        amount,
        currency: CURRENCY,
        razorpayOrderId: razorpayOrder.id,
      });

      await this.paymentRepository.updateBookingStatus(tx, bookingId, BookingStatus.PENDING_PAYMENT);
      await this.paymentRepository.createTransaction(tx, {
        paymentId: saved.id,
        type: PaymentTransactionType.AUTHORIZE,
        amount,
        status: 'ORDER_CREATED',
        razorpayEventId: razorpayOrder.id,
        gatewayResponse: this.toJson(razorpayOrder),
      });

      return saved;
    });

    const result = {
      keyId: this.razorpayGateway.getKeyId(),
      orderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: CURRENCY,
      receipt: booking.bookingNumber,
      payment,
    };

    if (idempotencyKey) {
      await this.setIdempotentResult(idempotencyKey, result);
    }

    return result;
  }

  async verifyPayment(dto: VerifyPaymentDto) {
    const validSignature = this.razorpayGateway.verifyCheckoutSignature({
      orderId: dto.razorpayOrderId,
      paymentId: dto.razorpayPaymentId,
      signature: dto.razorpaySignature,
    });

    if (!validSignature) {
      throw new UnauthorizedException({
        message: 'Payment signature verification failed',
        errorCode: ErrorCodes.PAYMENT_VERIFICATION_FAILED,
      });
    }

    const payment = await this.paymentRepository.findPaymentByOrderId(dto.razorpayOrderId);

    if (!payment) {
      throw new NotFoundException({
        message: 'Payment order not found',
        errorCode: ErrorCodes.PAYMENT_NOT_FOUND,
      });
    }

    if (payment.status === PaymentStatus.CAPTURED) {
      return { payment, alreadyCaptured: true };
    }

    const gatewayPayment = await this.razorpayGateway.fetchPayment(dto.razorpayPaymentId);
    const amountInPaise = this.toPaise(Number(payment.amount));

    if (gatewayPayment.amount !== amountInPaise) {
      throw new BadRequestException({
        message: 'Payment amount mismatch',
        errorCode: ErrorCodes.PAYMENT_AMOUNT_MISMATCH,
      });
    }

    const captured =
      gatewayPayment.status === 'captured'
        ? gatewayPayment
        : await this.razorpayGateway.capturePayment(dto.razorpayPaymentId, amountInPaise, payment.currency);

    const updated = await this.capturePaymentInDb(payment.id, {
      bookingId: payment.bookingId,
      razorpayPaymentId: dto.razorpayPaymentId,
      razorpaySignature: dto.razorpaySignature,
      amount: Number(payment.amount),
      method: dto.method ?? this.mapMethod(captured.method),
      eventId: dto.razorpayPaymentId,
      gatewayResponse: captured,
    });

    return { payment: updated, verified: true };
  }

  /**
   * Creates a Razorpay order for the delta amount when a technician's price
   * revision has been approved and the revised amount exceeds the original.
   *
   * Returns `{ requiresAdditionalPayment: false }` when no delta is owed
   * (e.g. revised price ≤ original price).
   */
  async createRevisionOrder(bookingId: string, userId: string) {
    const booking = await this.paymentRepository.findBookingForPayment(bookingId);

    if (!booking) {
      throw new NotFoundException({
        message: 'Booking not found',
        errorCode: ErrorCodes.BOOKING_NOT_FOUND,
      });
    }

    if (booking.customer.userId !== userId) {
      throw new ForbiddenException({
        message: 'Cannot create revision order for another customer booking',
        errorCode: ErrorCodes.AUTH_FORBIDDEN,
      });
    }

    if (booking.status !== BookingStatus.IN_PROGRESS) {
      throw new BadRequestException({
        message: 'Revision order can only be created when the booking is IN_PROGRESS',
        errorCode: ErrorCodes.BOOKING_INVALID_STATUS,
      });
    }

    const revisedAmount = Number((booking as any).revisedAmount);
    const originalAmount = Number(booking.totalAmount);

    if (!revisedAmount || revisedAmount <= originalAmount) {
      return { requiresAdditionalPayment: false, message: 'No additional payment required' };
    }

    const deltaAmount = revisedAmount - originalAmount;
    const deltaAmountInPaise = this.toPaise(deltaAmount);

    const razorpayOrder = await this.razorpayGateway.createOrder({
      amountInPaise: deltaAmountInPaise,
      currency: CURRENCY,
      receipt: `${(booking as any).bookingNumber}-REV`,
      notes: { bookingId, type: 'price_revision_delta' },
    });

    return {
      requiresAdditionalPayment: true,
      keyId: this.razorpayGateway.getKeyId(),
      orderId: razorpayOrder.id,
      deltaAmount: deltaAmountInPaise,
      currency: CURRENCY,
    };
  }

  async enqueueWebhook(rawBody: Buffer | string, signature: string | undefined) {
    if (!signature || !this.razorpayGateway.verifyWebhookSignature(rawBody, signature)) {
      throw new UnauthorizedException({
        message: 'Invalid Razorpay webhook signature',
        errorCode: ErrorCodes.PAYMENT_VERIFICATION_FAILED,
      });
    }

    const payload = JSON.parse(Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody);
    const eventId = payload.id ?? `${payload.event}:${payload.created_at}`;

    await this.webhookQueue.add(
      'process',
      { payload },
      {
        jobId: eventId,
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );

    return { received: true, queued: true, eventId };
  }

  async processWebhook(payload: any) {
    const eventId = payload.id ?? `${payload.event}:${payload.created_at}`;
    const existing = await this.paymentRepository.findTransactionByEventId(eventId);

    if (existing) {
      return { processed: false, duplicate: true };
    }

    switch (payload.event) {
      case 'payment.captured':
      case 'payment.authorized':
        return this.processPaymentWebhook(payload, eventId);
      case 'payment.failed':
        return this.processPaymentFailedWebhook(payload, eventId);
      case 'refund.processed':
      case 'refund.created':
        return this.processRefundWebhook(payload, eventId);
      default:
        this.logger.log(`Ignoring unsupported Razorpay webhook event: ${payload.event}`);
        return { processed: false, ignored: true };
    }
  }

  async refundPayment(paymentId: string, dto: RefundPaymentDto) {
    const idempotencyKey = dto.idempotencyKey
      ? `payment:refund:${paymentId}:${dto.idempotencyKey}`
      : undefined;
    const cached = idempotencyKey ? await this.getIdempotentResult(idempotencyKey) : null;

    if (cached) {
      return cached;
    }

    const payment = await this.paymentRepository.findPaymentById(paymentId);

    if (!payment) {
      throw new NotFoundException({
        message: 'Payment not found',
        errorCode: ErrorCodes.PAYMENT_NOT_FOUND,
      });
    }

    if (payment.status !== PaymentStatus.CAPTURED || !payment.razorpayPaymentId) {
      throw new ConflictException({
        message: 'Only captured payments can be refunded',
        errorCode: ErrorCodes.PAYMENT_REFUND_FAILED,
      });
    }

    const fullAmountInPaise = this.toPaise(Number(payment.amount));
    const refundAmountInPaise = dto.amountInPaise ?? fullAmountInPaise;

    if (refundAmountInPaise > fullAmountInPaise) {
      throw new BadRequestException({
        message: 'Refund amount cannot exceed payment amount',
        errorCode: ErrorCodes.PAYMENT_AMOUNT_MISMATCH,
      });
    }

    const refund = await this.razorpayGateway.refundPayment(payment.razorpayPaymentId, refundAmountInPaise, {
      reason: dto.reason ?? 'Refund requested',
      paymentId,
    });
    const refundStatus =
      refundAmountInPaise === fullAmountInPaise
        ? PaymentStatus.REFUNDED
        : PaymentStatus.PARTIALLY_REFUNDED;

    const updated = await this.paymentRepository.transaction(async (tx) => {
      const saved = await this.paymentRepository.markRefunded(tx, payment.id, refundStatus);

      await this.paymentRepository.createTransaction(tx, {
        paymentId: payment.id,
        type: PaymentTransactionType.REFUND,
        amount: refundAmountInPaise / 100,
        status: refund.status ?? 'refund_created',
        razorpayEventId: refund.id,
        gatewayResponse: this.toJson(refund),
      });

      return saved;
    });
    const result = { payment: updated, refund };

    if (idempotencyKey) {
      await this.setIdempotentResult(idempotencyKey, result);
    }

    return result;
  }

  async getInvoice(paymentId: string) {
    const payment = await this.paymentRepository.findPaymentById(paymentId);

    if (!payment) {
      throw new NotFoundException({
        message: 'Payment not found',
        errorCode: ErrorCodes.PAYMENT_NOT_FOUND,
      });
    }

    const gatewayInvoices = payment.razorpayPaymentId
      ? await this.razorpayGateway.fetchInvoicesByPayment(payment.razorpayPaymentId)
      : null;

    return {
      invoiceNumber: `INV-${payment.id.slice(0, 8).toUpperCase()}`,
      payment,
      gatewayInvoices,
    };
  }

  history(userId: string, query: PaymentHistoryQueryDto) {
    return this.paymentRepository.historyForUser(userId, query);
  }

  private async processPaymentWebhook(payload: any, eventId: string) {
    const entity = payload.payload?.payment?.entity;
    const payment = await this.paymentRepository.findPaymentByOrderId(entity.order_id);

    if (!payment) {
      throw new NotFoundException('Payment order not found for webhook');
    }

    const updated = await this.capturePaymentInDb(payment.id, {
      bookingId: payment.bookingId,
      razorpayPaymentId: entity.id,
      amount: Number(payment.amount),
      method: this.mapMethod(entity.method),
      eventId,
      gatewayResponse: payload,
    });

    return { processed: true, payment: updated };
  }

  private async processPaymentFailedWebhook(payload: any, eventId: string) {
    const entity = payload.payload?.payment?.entity;
    const payment = await this.paymentRepository.findPaymentByOrderId(entity.order_id);

    if (!payment) {
      throw new NotFoundException('Payment order not found for failed webhook');
    }

    await this.paymentRepository.transaction(async (tx) => {
      await this.paymentRepository.markFailed(tx, payment.id, entity.error_description ?? 'Payment failed');
      await this.paymentRepository.updateBookingStatus(tx, payment.bookingId, BookingStatus.FAILED);
      await this.paymentRepository.createTransaction(tx, {
        paymentId: payment.id,
        type: PaymentTransactionType.FAILURE,
        amount: Number(payment.amount),
        status: entity.status ?? 'failed',
        razorpayEventId: eventId,
        gatewayResponse: this.toJson(payload),
      });
    });

    // Notify customer of payment failure (fire-and-forget)
    this.notifyPaymentEvent(payment.bookingId, 'failed').catch((err) =>
      this.logger.warn(`Payment failure notification error: ${err.message}`),
    );

    return { processed: true };
  }

  private async processRefundWebhook(payload: any, eventId: string) {
    const entity = payload.payload?.refund?.entity;
    const payment = await this.paymentRepository.findPaymentByRazorpayPaymentId(entity.payment_id);

    if (!payment) {
      throw new NotFoundException('Payment not found for refund webhook');
    }

    await this.paymentRepository.transaction(async (tx) => {
      await this.paymentRepository.markRefunded(tx, payment.id, PaymentStatus.PARTIALLY_REFUNDED);
      await this.paymentRepository.createTransaction(tx, {
        paymentId: payment.id,
        type: PaymentTransactionType.REFUND,
        amount: Number(entity.amount ?? 0) / 100,
        status: entity.status ?? 'refund_processed',
        razorpayEventId: eventId,
        gatewayResponse: this.toJson(payload),
      });
    });

    return { processed: true };
  }

  async retryPendingPayments() {
    this.logger.log('Retrying pending payments...');
    const cutoffTime = new Date(Date.now() - 15 * 60 * 1000); // Stuck for more than 15 mins
    const stuckPayments = await this.paymentRepository.findStuckPayments(cutoffTime);

    let processedCount = 0;

    for (const payment of stuckPayments) {
      try {
        if (!payment.razorpayOrderId) continue;

        const order = await this.razorpayGateway.fetchOrder(payment.razorpayOrderId);
        
        if (order.status === 'paid') {
          // If the order is paid but our DB is PENDING, we likely missed the webhook.
          // Fetch the payments for this order to capture it.
          const payments = await this.razorpayGateway.fetchPaymentsByOrder(payment.razorpayOrderId);
          const successfulPayment = payments.items.find((p: any) => p.status === 'captured' || p.status === 'authorized');
          
          if (successfulPayment) {
            await this.capturePaymentInDb(payment.id, {
              bookingId: payment.bookingId,
              razorpayPaymentId: successfulPayment.id,
              amount: Number(payment.amount),
              method: this.mapMethod(successfulPayment.method),
              eventId: successfulPayment.id,
              gatewayResponse: successfulPayment,
            });
            processedCount++;
            this.logger.log(`Recovered stuck payment ${payment.id} for booking ${payment.bookingId}`);
          }
        }
      } catch (err) {
        this.logger.error(`Failed to retry payment ${payment.id}: ${err.message}`, err.stack);
      }
    }

    return { success: true, count: processedCount };
  }

  private async capturePaymentInDb(
    paymentId: string,
    params: {
      bookingId: string;
      razorpayPaymentId: string;
      amount: number;
      method?: PaymentMethod;
      razorpaySignature?: string;
      eventId: string;
      gatewayResponse: unknown;
    },
  ) {
    const updated = await this.paymentRepository.transaction(async (tx) => {
      const payment = await this.paymentRepository.markCaptured(tx, paymentId, {
        razorpayPaymentId: params.razorpayPaymentId,
        razorpaySignature: params.razorpaySignature,
        method: params.method,
      });

      await this.paymentRepository.updateBookingStatus(tx, params.bookingId, BookingStatus.CONFIRMED);
      await this.paymentRepository.createTransaction(tx, {
        paymentId,
        type: PaymentTransactionType.CAPTURE,
        amount: params.amount,
        status: 'captured',
        razorpayEventId: params.eventId,
        gatewayResponse: this.toJson(params.gatewayResponse),
      });

      return payment;
    });

    // Auto-dispatch to eligible technicians after successful payment (fire-and-forget)
    this.dispatchService.dispatch(params.bookingId).catch((err) =>
      this.logger.error(
        `Auto-dispatch failed for booking ${params.bookingId}: ${err.message}`,
        err.stack,
      ),
    );

    // Notify customer of successful payment (fire-and-forget)
    this.notifyPaymentEvent(params.bookingId, 'captured').catch((err) =>
      this.logger.warn(`Payment success notification error: ${err.message}`),
    );

    return updated;
  }

  /**
   * Sends a push notification to the booking's customer for payment events.
   */
  private async notifyPaymentEvent(bookingId: string, event: 'captured' | 'failed'): Promise<void> {
    const booking = await this.paymentRepository.findBookingForPayment(bookingId);
    if (!booking) return;

    const customerUserId = booking.customer.userId;
    const bookingRef = (booking as any).bookingNumber ?? bookingId;

    if (event === 'captured') {
      await this.notificationService.sendPushNotification({
        userId: customerUserId,
        title: 'Payment Confirmed ✅',
        body: `Payment for booking ${bookingRef} was successful. We are finding a technician for you.`,
        type: NotificationType.PAYMENT_UPDATE,
        payload: { bookingId, screen: 'booking_detail' },
      });
    } else {
      await this.notificationService.sendPushNotification({
        userId: customerUserId,
        title: 'Payment Failed ❌',
        body: `Payment for booking ${bookingRef} could not be processed. Please try again.`,
        type: NotificationType.PAYMENT_UPDATE,
        payload: { bookingId, screen: 'payment_retry' },
      });
    }
  }

  private mapMethod(method?: string): PaymentMethod | undefined {
    const normalized = method?.toUpperCase();
    return Object.values(PaymentMethod).includes(normalized as PaymentMethod)
      ? (normalized as PaymentMethod)
      : undefined;
  }

  private toPaise(amount: number) {
    return Math.round(amount * 100);
  }

  private toJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

  private async getIdempotentResult(key: string) {
    const value = await this.redisService.get(key);
    return value ? JSON.parse(value) : null;
  }

  private async setIdempotentResult(key: string, value: unknown) {
    await this.redisService.set(key, JSON.stringify(value), IDEMPOTENCY_TTL_SECONDS);
  }
}
