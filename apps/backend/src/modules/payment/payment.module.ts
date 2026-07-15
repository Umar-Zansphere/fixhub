import { Module } from '@nestjs/common';

import { QueueModule } from '../../common/queue/queue.module';
import { RedisModule } from '../../common/redis/redis.module';
import { PaymentController } from './controllers/payment.controller';
import { PaymentWebhookProcessor } from './processors/payment-webhook.processor';
import { PaymentRepository } from './repositories/payment.repository';
import { PaymentService } from './services/payment.service';
import { RazorpayGatewayService } from './services/razorpay-gateway.service';

@Module({
  imports: [QueueModule, RedisModule],
  controllers: [PaymentController],
  providers: [PaymentService, RazorpayGatewayService, PaymentRepository, PaymentWebhookProcessor],
  exports: [PaymentService],
})
export class PaymentModule {}
