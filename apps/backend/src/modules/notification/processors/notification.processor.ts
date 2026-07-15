import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { QUEUE_NAMES } from '../../../common/queue/queue.constants';
import { NotificationChannel } from '../dto';
import { NotificationService } from '../services/notification.service';

type NotificationJobData = {
  notificationId: string;
  channel: NotificationChannel;
};

abstract class NotificationWorkerBase extends WorkerHost {
  protected readonly logger = new Logger(this.constructor.name);

  protected constructor(
    protected readonly notificationService: NotificationService,
    private readonly channel: NotificationChannel,
  ) {
    super();
  }

  async process(job: Job<NotificationJobData>): Promise<void> {
    try {
      await this.notificationService.processChannel(this.channel, job.data.notificationId);
    } catch (error) {
      this.logger.error(`Failed ${this.channel} notification job ${job.id}`, error);

      if (job.attemptsMade + 1 >= (job.opts.attempts ?? 1)) {
        await this.notificationService.moveToDeadLetter({
          id: job.id,
          name: job.name,
          data: job.data,
          failedReason: (error as Error).message,
        });
      }

      throw error;
    }
  }
}

@Processor(QUEUE_NAMES.NOTIFICATION)
export class PushNotificationProcessor extends NotificationWorkerBase {
  constructor(notificationService: NotificationService) {
    super(notificationService, NotificationChannel.PUSH);
  }
}

@Processor(QUEUE_NAMES.SMS)
export class SmsNotificationProcessor extends NotificationWorkerBase {
  constructor(notificationService: NotificationService) {
    super(notificationService, NotificationChannel.SMS);
  }
}

@Processor(QUEUE_NAMES.EMAIL)
export class EmailNotificationProcessor extends NotificationWorkerBase {
  constructor(notificationService: NotificationService) {
    super(notificationService, NotificationChannel.EMAIL);
  }
}
