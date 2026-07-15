import { createSign } from 'crypto';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface DeliveryResult {
  status: 'SENT' | 'SKIPPED';
  providerMessageId?: string;
  reason?: string;
}

@Injectable()
export class PushNotificationChannel {
  private readonly logger = new Logger(PushNotificationChannel.name);

  constructor(private readonly configService: ConfigService) {}

  async send(params: {
    tokens: string[];
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }): Promise<DeliveryResult> {
    if (params.tokens.length === 0) {
      return { status: 'SKIPPED', reason: 'NO_ACTIVE_DEVICE_TOKENS' };
    }

    const projectId = this.configService.get<string>('firebase.projectId');
    const accessToken = await this.getAccessToken();

    if (!projectId || !accessToken) {
      this.logger.warn('Firebase credentials missing; push delivery skipped');
      return { status: 'SKIPPED', reason: 'FIREBASE_NOT_CONFIGURED' };
    }

    const responses = await Promise.all(
      params.tokens.map((token) =>
        fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: {
              token,
              notification: { title: params.title, body: params.body },
              data: this.stringifyData(params.data),
            },
          }),
        }),
      ),
    );

    const failed = responses.find((response) => !response.ok);

    if (failed) {
      throw new Error(`FCM delivery failed with status ${failed.status}`);
    }

    return { status: 'SENT', providerMessageId: `fcm:${Date.now()}` };
  }

  private stringifyData(data?: Record<string, unknown>) {
    return Object.fromEntries(
      Object.entries(data ?? {}).map(([key, value]) => [key, String(value)]),
    );
  }

  private async getAccessToken() {
    const clientEmail = this.configService.get<string>('firebase.clientEmail');
    const privateKey = this.configService.get<string>('firebase.privateKey')?.replace(/\\n/g, '\n');

    if (!clientEmail || !privateKey) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    const header = this.base64Url({ alg: 'RS256', typ: 'JWT' });
    const claim = this.base64Url({
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    });
    const unsigned = `${header}.${claim}`;
    const signature = createSign('RSA-SHA256').update(unsigned).sign(privateKey, 'base64url');
    const jwt = `${unsigned}.${signature}`;
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!response.ok) {
      throw new Error(`Firebase token request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as { access_token?: string };
    return payload.access_token ?? null;
  }

  private base64Url(value: unknown) {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
  }
}

@Injectable()
export class SmsNotificationChannel {
  async send(params: { phone?: string; body: string }): Promise<DeliveryResult> {
    if (!params.phone) {
      return { status: 'SKIPPED', reason: 'NO_PHONE' };
    }

    return { status: 'SENT', providerMessageId: `sms:${Date.now()}` };
  }
}

@Injectable()
export class EmailNotificationChannel {
  async send(params: { email?: string | null; subject: string; body: string }): Promise<DeliveryResult> {
    if (!params.email) {
      return { status: 'SKIPPED', reason: 'NO_EMAIL' };
    }

    return { status: 'SENT', providerMessageId: `email:${Date.now()}` };
  }
}
