export const QUEUE_NAMES = {
  NOTIFICATION: 'notification',
  EMAIL: 'email',
  SMS: 'sms',
  PAYMENT_WEBHOOK: 'payment-webhook',
  MEDIA_PROCESSING: 'media-processing',
  SCHEDULED_JOBS: 'scheduled-jobs',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
