import { Module } from '@nestjs/common';

import { QueueModule } from '../../common/queue/queue.module';
import { JobsMonitoringController } from './controllers/jobs-monitoring.controller';
import { JobsSchedulerService } from './services/jobs-scheduler.service';
import { ScheduledJobsWorker } from './workers/scheduled-jobs.worker';

@Module({
  imports: [QueueModule],
  controllers: [JobsMonitoringController],
  providers: [JobsSchedulerService, ScheduledJobsWorker],
})
export class JobsModule {}
