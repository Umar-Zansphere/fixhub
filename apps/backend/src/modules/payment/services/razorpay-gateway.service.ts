import { createHmac, timingSafeEqual } from 'crypto';

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RazorpayGatewayService {
  private readonly keyId: string;
  private readonly keySecret: string;
  private readonly webhookSecret?: string;
  private readonly baseUrl = 'https://api.razorpay.com/v1';

  constructor(private readonly configService: ConfigService) {
    this.keyId = this.configService.get<string>('razorpay.keyId', '');
    this.keySecret = this.configService.get<string>('razorpay.keySecret', '');
    this.webhookSecret = this.configService.get<string>('razorpay.webhookSecret');
  }

  async createOrder(params: {
    amountInPaise: number;
    currency: string;
    receipt: string;
    notes?: Record<string, string>;
  }) {
    return this.request('orders', 'POST', {
      amount: params.amountInPaise,
      currency: params.currency,
      receipt: params.receipt,
      notes: params.notes,
    });
  }

  async fetchPayment(paymentId: string) {
    return this.request(`payments/${paymentId}`, 'GET');
  }

  async capturePayment(paymentId: string, amountInPaise: number, currency: string) {
    return this.request(`payments/${paymentId}/capture`, 'POST', {
      amount: amountInPaise,
      currency,
    });
  }

  async refundPayment(paymentId: string, amountInPaise: number, notes?: Record<string, string>) {
    return this.request(`payments/${paymentId}/refund`, 'POST', {
      amount: amountInPaise,
      notes,
    });
  }

  async fetchInvoicesByPayment(paymentId: string) {
    return this.request(`invoices?payment_id=${encodeURIComponent(paymentId)}`, 'GET');
  }

  verifyCheckoutSignature(params: {
    orderId: string;
    paymentId: string;
    signature: string;
  }) {
    const payload = `${params.orderId}|${params.paymentId}`;
    return this.verifySignature(payload, params.signature, this.keySecret);
  }

  verifyWebhookSignature(rawBody: Buffer | string, signature: string) {
    if (!this.webhookSecret) {
      return false;
    }

    return this.verifySignature(rawBody, signature, this.webhookSecret);
  }

  getKeyId() {
    return this.keyId;
  }

  private verifySignature(payload: Buffer | string, signature: string, secret: string) {
    const expected = createHmac('sha256', secret).update(payload).digest('hex');
    const expectedBuffer = Buffer.from(expected);
    const signatureBuffer = Buffer.from(signature);

    return (
      expectedBuffer.length === signatureBuffer.length &&
      timingSafeEqual(expectedBuffer, signatureBuffer)
    );
  }

  private async request(path: string, method: 'GET' | 'POST', body?: unknown) {
    if (!this.keyId || !this.keySecret) {
      throw new InternalServerErrorException('Razorpay credentials are not configured');
    }

    const requestOptions: RequestInit = {
      method,
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      requestOptions.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}/${path}`, requestOptions);
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new InternalServerErrorException({
        message: 'Razorpay request failed',
        gatewayResponse: payload,
      });
    }

    return payload;
  }
}
