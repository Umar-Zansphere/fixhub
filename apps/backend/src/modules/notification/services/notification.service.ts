import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';

import { PaginationDto } from '../../../common/dto/pagination.dto';
import { QUEUE_NAMES } from '../../../common/queue/queue.constants';
import { NotificationRepository } from '../repositories/notification.repository';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly notificationRepository: NotificationRepository,
    @InjectQueue(QUEUE_NAMES.NOTIFICATION) private readonly notificationQueue: Queue,
  ) {}

  async listByUser(userId: string, pagination: PaginationDto) {
    return this.notificationRepository.findByUser(userId, pagination);
  }

  async markAsRead(id: string, userId: string) {
    return this.notificationRepository.markAsRead(id, userId);
  }

  async markAllAsRead(userId: string) {
    return this.notificationRepository.markAllAsRead(userId);
  }

  /**
   * Queue a push notification for async processing
   */
  async sendPushNotification(data: {
    userId: string;
    title: string;
    body: string;
    type: string;
    payload?: Record<string, unknown>;
  }) {
    await this.notificationQueue.add('push', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
    this.logger.log(`Push notification queued for user: ${data.userId}`);
  }
}
