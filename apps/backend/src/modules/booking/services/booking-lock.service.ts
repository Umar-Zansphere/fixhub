import { Injectable } from '@nestjs/common';

import { RedisService } from '../../../common/redis/redis.service';

const LOCK_TTL_SECONDS = 15;

@Injectable()
export class BookingLockService {
  constructor(private readonly redisService: RedisService) {}

  async acquire(key: string): Promise<string | null> {
    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const result = await this.redisService
      .getClient()
      .set(this.lockKey(key), token, 'EX', LOCK_TTL_SECONDS, 'NX');

    return result === 'OK' ? token : null;
  }

  async release(key: string, token: string): Promise<void> {
    const client = this.redisService.getClient();
    const redisKey = this.lockKey(key);
    const currentToken = await client.get(redisKey);

    if (currentToken === token) {
      await client.del(redisKey);
    }
  }

  async nextBookingNumber(date: Date): Promise<string> {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const key = `booking:sequence:${yyyy}${mm}${dd}`;
    const sequence = await this.redisService.incr(key);

    if (sequence === 1) {
      await this.redisService.expire(key, 60 * 60 * 24 * 2);
    }

    return `FH-${yyyy}${mm}${dd}-${String(sequence).padStart(4, '0')}`;
  }

  async setDraftExpiry(bookingId: string, ttlSeconds: number): Promise<void> {
    await this.redisService.set(this.draftKey(bookingId), 'active', ttlSeconds);
  }

  async isDraftActive(bookingId: string): Promise<boolean> {
    return this.redisService.exists(this.draftKey(bookingId));
  }

  async clearDraftExpiry(bookingId: string): Promise<void> {
    await this.redisService.del(this.draftKey(bookingId));
  }

  private lockKey(key: string) {
    return `booking:lock:${key}`;
  }

  private draftKey(bookingId: string) {
    return `booking:draft:${bookingId}`;
  }
}
