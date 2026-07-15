import { Module } from '@nestjs/common';

import { PrismaModule } from '../../common/database/prisma.module';
import { RedisModule } from '../../common/redis/redis.module';
import { AdminCatalogController } from './controllers/admin-catalog.controller';
import { CatalogController } from './controllers/catalog.controller';
import { CatalogRepository } from './repositories/catalog.repository';
import { CatalogCacheService } from './services/catalog-cache.service';
import { CatalogService } from './services/catalog.service';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [CatalogController, AdminCatalogController],
  providers: [CatalogService, CatalogRepository, CatalogCacheService],
  exports: [CatalogService],
})
export class CatalogModule {}
