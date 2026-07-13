import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { QUEUE_NAMES } from '../../../common/queue/queue.constants';
import { NotificationRepository } from '../repositories/notification.repository';

@Processor(QUEUE_NAMES.NOTIFICATION)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly notificationRepository: NotificationRepository) {
    super();
  }

  async process(job: Job): Promise<void> {
    const { userId, title, body, type, payload } = job.data;

    this.logger.log(`Processing notification job ${job.id} for user ${userId}`);

    try {
      // 1. Save notification to DB
      await this.notificationRepository.create({
        userId,
        title,
        body,
        type,
        data: payload,
      });

      // 2. Send FCM push notification
      // TODO: Implement Firebase Admin SDK push notification
      this.logger.log(`Notification sent to user ${userId}: ${title}`);
    } catch (error) {
      this.logger.error(`Failed to process notification job ${job.id}`, error);
      throw error; // BullMQ will retry based on job options
    }
  }
}
