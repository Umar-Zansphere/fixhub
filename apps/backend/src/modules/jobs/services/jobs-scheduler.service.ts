import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Queue } from 'bullmq';

import { QUEUE_NAMES } from '../../../common/queue/queue.constants';

@Injectable()
export class JobsSchedulerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(JobsSchedulerService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.SCHEDULED_JOBS) private readonly scheduledJobsQueue: Queue,
  ) {}

  async onApplicationBootstrap() {
    await this.setupCronJobs();
  }

  private async setupCronJobs() {
    this.logger.log('Setting up repeatable cron jobs...');

    // Clear existing repeatable jobs to avoid duplicates on startup if schedules change
    const repeatableJobs = await this.scheduledJobsQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      await this.scheduledJobsQueue.removeRepeatableByKey(job.key);
    }

    // Daily Reports - Midnight daily
    await this.scheduledJobsQueue.add('generate-daily-reports', {}, {
      repeat: { pattern: '0 0 * * *' },
      jobId: 'generate-daily-reports-job',
    });

    // Booking Expiry - Every 15 minutes
    await this.scheduledJobsQueue.add('booking-expiry', {}, {
      repeat: { pattern: '*/15 * * * *' },
      jobId: 'booking-expiry-job',
    });

    // OTP Cleanup - Every hour
    await this.scheduledJobsQueue.add('otp-cleanup', {}, {
      repeat: { pattern: '0 * * * *' },
      jobId: 'otp-cleanup-job',
    });

    // Notification Retry - Every 5 minutes
    await this.scheduledJobsQueue.add('notification-retry', {}, {
      repeat: { pattern: '*/5 * * * *' },
      jobId: 'notification-retry-job',
    });

    // Payment Retry - Every 30 minutes
    await this.scheduledJobsQueue.add('payment-retry', {}, {
      repeat: { pattern: '*/30 * * * *' },
      jobId: 'payment-retry-job',
    });

    // Audit Cleanup - 2 AM daily
    await this.scheduledJobsQueue.add('audit-cleanup', {}, {
      repeat: { pattern: '0 2 * * *' },
      jobId: 'audit-cleanup-job',
    });

    this.logger.log('Cron jobs setup complete.');
  }
}
