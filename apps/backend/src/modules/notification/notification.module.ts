import { Module } from '@nestjs/common';

import { NotificationController } from './controllers/notification.controller';
import { NotificationProcessor } from './processors/notification.processor';
import { NotificationRepository } from './repositories/notification.repository';
import { NotificationService } from './services/notification.service';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService, NotificationRepository, NotificationProcessor],
  exports: [NotificationService],
})
export class NotificationModule {}
