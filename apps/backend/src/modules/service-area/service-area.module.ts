import { Module } from '@nestjs/common';

import { PrismaModule } from '../../common/database/prisma.module';
import { RedisModule } from '../../common/redis/redis.module';
import { AdminServiceAreaController } from './controllers/admin-service-area.controller';
import { ServiceAreaController } from './controllers/service-area.controller';
import { ServiceAreaRepository } from './repositories/service-area.repository';
import { ServiceAreaCacheService } from './services/service-area-cache.service';
import { ServiceAreaService } from './services/service-area.service';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [ServiceAreaController, AdminServiceAreaController],
  providers: [ServiceAreaService, ServiceAreaRepository, ServiceAreaCacheService],
  exports: [ServiceAreaService],
})
export class ServiceAreaModule {}
