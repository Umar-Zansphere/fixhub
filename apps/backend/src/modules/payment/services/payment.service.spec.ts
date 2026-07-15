import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { BookingStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

import { QUEUE_NAMES } from '../../../common/queue/queue.constants';
import { RedisService } from '../../../common/redis/redis.service';
import { PaymentRepository } from '../repositories/payment.repository';
import { PaymentService } from './payment.service';
import { RazorpayGatewayService } from './razorpay-gateway.service';

describe('PaymentService', () => {
  let service: PaymentService;
  let repository: jest.Mocked<PaymentRepository>;
  let gateway: jest.Mocked<RazorpayGatewayService>;
  let redisService: jest.Mocked<RedisService>;
  let queue: { add: jest.Mock };

  const booking = {
    id: 'booking-uuid-1',
    bookingNumber: 'FH-20990720-0001',
    customerId: 'customer-uuid-1',
    status: BookingStatus.CONFIRMED,
    totalAmount: 499,
    customer: { userId: 'customer-user-uuid-1' },
    payment: null,
  };
  const payment = {
    id: 'payment-uuid-1',
    bookingId: booking.id,
    razorpayOrderId: 'order_123',
    razorpayPaymentId: null,
    amount: 499,
    currency: 'INR',
    status: PaymentStatus.PENDING,
    booking,
    transactions: [],
  };

  beforeEach(async () => {
    queue = { add: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: PaymentRepository,
          useValue: {
            findBookingForPayment: jest.fn(),
            findPaymentByOrderId: jest.fn(),
            findPaymentById: jest.fn(),
            findPaymentByRazorpayPaymentId: jest.fn(),
            findTransactionByEventId: jest.fn(),
            upsertOrder: jest.fn(),
            markCaptured: jest.fn(),
            markFailed: jest.fn(),
            markRefunded: jest.fn(),
            updateBookingStatus: jest.fn(),
            createTransaction: jest.fn(),
            historyForUser: jest.fn(),
            transaction: jest.fn((fn) => fn({})),
          },
        },
        {
          provide: RazorpayGatewayService,
          useValue: {
            createOrder: jest.fn(),
            verifyCheckoutSignature: jest.fn(),
            verifyWebhookSignature: jest.fn(),
            getKeyId: jest.fn(),
            fetchPayment: jest.fn(),
            capturePayment: jest.fn(),
            refundPayment: jest.fn(),
            fetchInvoicesByPayment: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
        {
          provide: getQueueToken(QUEUE_NAMES.PAYMENT_WEBHOOK),
          useValue: queue,
        },
      ],
    }).compile();

    service = module.get(PaymentService);
    repository = module.get(PaymentRepository);
    gateway = module.get(RazorpayGatewayService);
    redisService = module.get(RedisService);
  });

  it('creates a Razorpay order and stores payment transactionally', async () => {
    repository.findBookingForPayment.mockResolvedValue(booking as any);
    gateway.getKeyId.mockReturnValue('rzp_test_key');
    gateway.createOrder.mockResolvedValue({
      id: 'order_123',
      amount: 49900,
      currency: 'INR',
      receipt: booking.bookingNumber,
    });
    repository.upsertOrder.mockResolvedValue(payment as any);

    const result = await service.createOrder(booking.id, booking.customer.userId, {
      idempotencyKey: 'abc',
    });

    expect(result.orderId).toBe('order_123');
    expect(gateway.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        amountInPaise: 49900,
        receipt: booking.bookingNumber,
      }),
    );
    expect(repository.updateBookingStatus).toHaveBeenCalledWith(
      {},
      booking.id,
      BookingStatus.PENDING_PAYMENT,
    );
    expect(repository.createTransaction).toHaveBeenCalled();
    expect(redisService.set).toHaveBeenCalled();
  });

  it('returns cached idempotent order result', async () => {
    redisService.get.mockResolvedValue(JSON.stringify({ orderId: 'cached_order' }));

    const result = await service.createOrder(booking.id, booking.customer.userId, {
      idempotencyKey: 'abc',
    });

    expect(result.orderId).toBe('cached_order');
    expect(repository.findBookingForPayment).not.toHaveBeenCalled();
  });

  it('rejects order creation for another customer booking', async () => {
    repository.findBookingForPayment.mockResolvedValue(booking as any);

    await expect(service.createOrder(booking.id, 'other-user')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('rejects order creation for non-payable booking status', async () => {
    repository.findBookingForPayment.mockResolvedValue({
      ...booking,
      status: BookingStatus.COMPLETED,
    } as any);

    await expect(service.createOrder(booking.id, booking.customer.userId)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('verifies, captures, and stores payment', async () => {
    gateway.verifyCheckoutSignature.mockReturnValue(true);
    repository.findPaymentByOrderId.mockResolvedValue(payment as any);
    gateway.fetchPayment.mockResolvedValue({
      id: 'pay_123',
      amount: 49900,
      status: 'authorized',
      method: 'upi',
    });
    gateway.capturePayment.mockResolvedValue({
      id: 'pay_123',
      amount: 49900,
      status: 'captured',
      method: 'upi',
    });
    repository.markCaptured.mockResolvedValue({
      ...payment,
      status: PaymentStatus.CAPTURED,
    } as any);

    const result = await service.verifyPayment({
      razorpayOrderId: 'order_123',
      razorpayPaymentId: 'pay_123',
      razorpaySignature: 'sig',
    });

    expect(result.verified).toBe(true);
    expect(repository.markCaptured).toHaveBeenCalledWith(
      {},
      payment.id,
      expect.objectContaining({
        razorpayPaymentId: 'pay_123',
        method: PaymentMethod.UPI,
      }),
    );
    expect(repository.updateBookingStatus).toHaveBeenCalledWith(
      {},
      booking.id,
      BookingStatus.CONFIRMED,
    );
  });

  it('rejects invalid checkout signature', async () => {
    gateway.verifyCheckoutSignature.mockReturnValue(false);

    await expect(
      service.verifyPayment({
        razorpayOrderId: 'order_123',
        razorpayPaymentId: 'pay_123',
        razorpaySignature: 'bad',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects amount mismatch during verification', async () => {
    gateway.verifyCheckoutSignature.mockReturnValue(true);
    repository.findPaymentByOrderId.mockResolvedValue(payment as any);
    gateway.fetchPayment.mockResolvedValue({ id: 'pay_123', amount: 100, status: 'captured' });

    await expect(
      service.verifyPayment({
        razorpayOrderId: 'order_123',
        razorpayPaymentId: 'pay_123',
        razorpaySignature: 'sig',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('validates webhook signature and queues webhook job', async () => {
    gateway.verifyWebhookSignature.mockReturnValue(true);

    const result = await service.enqueueWebhook(
      Buffer.from(JSON.stringify({ id: 'evt_123', event: 'payment.captured' })),
      'sig',
    );

    expect(result.queued).toBe(true);
    expect(queue.add).toHaveBeenCalledWith(
      'process',
      expect.objectContaining({ payload: expect.objectContaining({ id: 'evt_123' }) }),
      expect.objectContaining({ jobId: 'evt_123', attempts: 5 }),
    );
  });

  it('rejects invalid webhook signature', async () => {
    gateway.verifyWebhookSignature.mockReturnValue(false);

    await expect(service.enqueueWebhook(Buffer.from('{}'), 'bad')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('processes duplicate webhook idempotently', async () => {
    repository.findTransactionByEventId.mockResolvedValue({ id: 'txn-uuid-1' } as any);

    const result = await service.processWebhook({ id: 'evt_123', event: 'payment.captured' });

    expect(result).toEqual({ processed: false, duplicate: true });
  });

  it('refunds captured payment and records refund transaction', async () => {
    repository.findPaymentById.mockResolvedValue({
      ...payment,
      status: PaymentStatus.CAPTURED,
      razorpayPaymentId: 'pay_123',
    } as any);
    gateway.refundPayment.mockResolvedValue({ id: 'rfnd_123', status: 'processed' });
    repository.markRefunded.mockResolvedValue({
      ...payment,
      status: PaymentStatus.REFUNDED,
    } as any);

    const result = await service.refundPayment(payment.id, { idempotencyKey: 'refund-1' });

    expect(result.refund.id).toBe('rfnd_123');
    expect(repository.createTransaction).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ type: 'REFUND' }),
    );
    expect(redisService.set).toHaveBeenCalled();
  });

  it('returns invoice data', async () => {
    repository.findPaymentById.mockResolvedValue({
      ...payment,
      razorpayPaymentId: 'pay_123',
    } as any);
    gateway.fetchInvoicesByPayment.mockResolvedValue({ items: [{ id: 'inv_123' }] });

    const result = await service.getInvoice(payment.id);

    expect(result.invoiceNumber).toContain('INV-');
    expect(result.gatewayInvoices).toEqual({ items: [{ id: 'inv_123' }] });
  });

  it('throws when invoice payment is missing', async () => {
    repository.findPaymentById.mockResolvedValue(null);

    await expect(service.getInvoice('missing')).rejects.toThrow(NotFoundException);
  });

  it('delegates payment history to repository', async () => {
    repository.historyForUser.mockResolvedValue({ items: [], meta: { total: 0 } } as any);

    await service.history('customer-user-uuid-1', {} as any);

    expect(repository.historyForUser).toHaveBeenCalledWith('customer-user-uuid-1', {});
  });
});
