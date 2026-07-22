import { Module } from '@nestjs/common';

import { QueueModule } from '../../common/queue/queue.module';
import { BookingModule } from '../booking/booking.module';
import { PaymentModule } from '../payment/payment.module';
import { JobsMonitoringController } from './controllers/jobs-monitoring.controller';
import { JobsSchedulerService } from './services/jobs-scheduler.service';
import { ScheduledJobsWorker } from './workers/scheduled-jobs.worker';

@Module({
  imports: [QueueModule, BookingModule, PaymentModule],
  controllers: [JobsMonitoringController],
  providers: [JobsSchedulerService, ScheduledJobsWorker],
})
export class JobsModule {}
