import { Injectable } from '@nestjs/common';

import { RedisService } from '../../../common/redis/redis.service';

@Injectable()
export class ReportingCacheService {
  private readonly DEFAULT_TTL = 3600; // 1 hour

  constructor(private readonly redisService: RedisService) {}

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redisService.get(`reports:${key}`);
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, value: any, ttlSeconds: number = this.DEFAULT_TTL): Promise<void> {
    await this.redisService.set(`reports:${key}`, JSON.stringify(value), ttlSeconds);
  }

  async invalidate(pattern: string = '*'): Promise<void> {
    const client = this.redisService.getClient();
    const keys = await client.keys(`reports:${pattern}`);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  }

  generateKey(reportType: string, startDate?: Date, endDate?: Date): string {
    const start = startDate ? startDate.toISOString().slice(0, 10) : 'all';
    const end = endDate ? endDate.toISOString().slice(0, 10) : 'all';
    return `${reportType}:${start}:${end}`;
  }
}
