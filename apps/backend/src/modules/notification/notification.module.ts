import { Module } from '@nestjs/common';

import { QueueModule } from '../../common/queue/queue.module';
import { NotificationController } from './controllers/notification.controller';
import { NotificationProcessor } from './processors/notification.processor';
import { NotificationRepository } from './repositories/notification.repository';
import { NotificationService } from './services/notification.service';

@Module({
  imports: [QueueModule],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationRepository, NotificationProcessor],
  exports: [NotificationService],
})
export class NotificationModule {}
