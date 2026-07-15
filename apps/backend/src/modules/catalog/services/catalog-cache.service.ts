import { Injectable, Logger } from '@nestjs/common';

import { RedisService } from '../../../common/redis/redis.service';

const CACHE_PREFIX = 'catalog';
const CACHE_TTL_SECONDS = 300;

@Injectable()
export class CatalogCacheService {
  private readonly logger = new Logger(CatalogCacheService.name);

  constructor(private readonly redisService: RedisService) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redisService.get(this.key(key));
      return value ? (JSON.parse(value) as T) : null;
    } catch (error) {
      this.logger.warn(`Catalog cache read failed: ${(error as Error).message}`);
      return null;
    }
  }

  async set(key: string, value: unknown): Promise<void> {
    try {
      await this.redisService.set(this.key(key), JSON.stringify(value), CACHE_TTL_SECONDS);
    } catch (error) {
      this.logger.warn(`Catalog cache write failed: ${(error as Error).message}`);
    }
  }

  async invalidate(): Promise<void> {
    try {
      const client = this.redisService.getClient();
      const keys: string[] = [];
      let cursor = '0';

      do {
        const [nextCursor, batch] = await client.scan(
          cursor,
          'MATCH',
          `${CACHE_PREFIX}:*`,
          'COUNT',
          100,
        );
        cursor = nextCursor;
        keys.push(...batch);
      } while (cursor !== '0');

      await Promise.all(keys.map((key) => client.del(key)));
    } catch (error) {
      this.logger.warn(`Catalog cache invalidation failed: ${(error as Error).message}`);
    }
  }

  private key(key: string) {
    return `${CACHE_PREFIX}:${key}`;
  }
}
