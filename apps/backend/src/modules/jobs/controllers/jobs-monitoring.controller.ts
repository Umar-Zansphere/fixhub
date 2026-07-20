import { InjectQueue } from '@nestjs/bullmq';
import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Queue } from 'bullmq';

import { Roles } from '../../../common/decorators/roles.decorator';
import { QUEUE_NAMES } from '../../../common/queue/queue.constants';

@ApiTags('Jobs')
@ApiBearerAuth()
@Controller('jobs')
@Roles(Role.ADMIN)
export class JobsMonitoringController {
  constructor(
    @InjectQueue(QUEUE_NAMES.SCHEDULED_JOBS) private readonly scheduledJobsQueue: Queue,
    @InjectQueue(QUEUE_NAMES.NOTIFICATION) private readonly notificationQueue: Queue,
    @InjectQueue(QUEUE_NAMES.EMAIL) private readonly emailQueue: Queue,
    @InjectQueue(QUEUE_NAMES.PAYMENT_WEBHOOK) private readonly paymentWebhookQueue: Queue,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get current job queue statistics' })
  async getQueueStats() {
    const queues = [
      { name: QUEUE_NAMES.SCHEDULED_JOBS, instance: this.scheduledJobsQueue },
      { name: QUEUE_NAMES.NOTIFICATION, instance: this.notificationQueue },
      { name: QUEUE_NAMES.EMAIL, instance: this.emailQueue },
      { name: QUEUE_NAMES.PAYMENT_WEBHOOK, instance: this.paymentWebhookQueue },
    ];

    const stats = await Promise.all(
      queues.map(async (q) => {
        const counts = await q.instance.getJobCounts();
        return {
          queue: q.name,
          ...counts,
        };
      }),
    );

    return {
      success: true,
      data: stats,
    };
  }
}
