import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { QUEUE_NAMES } from '../../../common/queue/queue.constants';
import { PaymentService } from '../services/payment.service';

@Processor(QUEUE_NAMES.PAYMENT_WEBHOOK)
export class PaymentWebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(PaymentWebhookProcessor.name);

  constructor(private readonly paymentService: PaymentService) {
    super();
  }

  async process(job: Job<{ payload: unknown }>) {
    this.logger.log(`Processing Razorpay webhook job ${job.id}`);
    return this.paymentService.processWebhook(job.data.payload);
  }
}
