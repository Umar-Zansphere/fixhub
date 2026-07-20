import { Module } from '@nestjs/common';

import { RedisModule } from '../../common/redis/redis.module';
import { ReportingController } from './controllers/reporting.controller';
import { ReportingRepository } from './repositories/reporting.repository';
import { ExportService } from './services/export.service';
import { ReportingCacheService } from './services/reporting-cache.service';
import { ReportingService } from './services/reporting.service';

@Module({
  imports: [RedisModule],
  controllers: [ReportingController],
  providers: [ReportingService, ReportingRepository, ReportingCacheService, ExportService],
})
export class ReportingModule {}
