import { Module } from '@nestjs/common';

import { QueueModule } from '../../common/queue/queue.module';
import { RedisModule } from '../../common/redis/redis.module';
import { NotificationController } from './controllers/notification.controller';
import {
  EmailNotificationProcessor,
  PushNotificationProcessor,
  SmsNotificationProcessor,
} from './processors/notification.processor';
import { NotificationRepository } from './repositories/notification.repository';
import {
  EmailNotificationChannel,
  PushNotificationChannel,
  SmsNotificationChannel,
} from './services/notification-channel.service';
import { NotificationService } from './services/notification.service';

@Module({
  imports: [QueueModule, RedisModule],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationRepository,
    PushNotificationChannel,
    SmsNotificationChannel,
    EmailNotificationChannel,
    PushNotificationProcessor,
    SmsNotificationProcessor,
    EmailNotificationProcessor,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
