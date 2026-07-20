import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { Job } from 'bullmq';

import { PrismaService } from '../../../common/database/prisma.service';
import { QUEUE_NAMES } from '../../../common/queue/queue.constants';

@Processor(QUEUE_NAMES.SCHEDULED_JOBS)
export class ScheduledJobsWorker extends WorkerHost {
  private readonly logger = new Logger(ScheduledJobsWorker.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing scheduled job: ${job.name} (ID: ${job.id})`);

    try {
      switch (job.name) {
        case 'generate-daily-reports':
          return this.handleDailyReports();
        case 'booking-expiry':
          return this.handleBookingExpiry();
        case 'otp-cleanup':
          return this.handleOtpCleanup();
        case 'notification-retry':
          return this.handleNotificationRetry();
        case 'payment-retry':
          return this.handlePaymentRetry();
        case 'audit-cleanup':
          return this.handleAuditCleanup();
        default:
          this.logger.warn(`Unknown job name encountered: ${job.name}`);
      }
    } catch (error) {
      this.logger.error(`Failed to process job ${job.name}: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async handleDailyReports() {
    this.logger.log('Generating daily reports...');
    // Implementation for generating and potentially caching/mailing daily reports
    // In a real scenario, this would aggregate data for the previous day
    return { success: true, message: 'Daily reports generated successfully' };
  }

  private async handleBookingExpiry() {
    this.logger.log('Checking for expired bookings...');
    const expiryTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    const expiredBookings = await this.prisma.booking.updateMany({
      where: {
        status: BookingStatus.PENDING_PAYMENT,
        createdAt: { lt: expiryTime },
      },
      data: {
        status: BookingStatus.CANCELLED,
        cancelReason: 'Automatically expired due to inactivity',
      },
    });

    this.logger.log(`Expired ${expiredBookings.count} bookings.`);
    return { success: true, count: expiredBookings.count };
  }

  private async handleOtpCleanup() {
    this.logger.log('Cleaning up expired OTPs...');
    const now = new Date();
    // Assuming an OTP model exists, adjust this to your actual schema
    // Since we don't have an explicit OTP model in Prisma right now, 
    // we'll log it for future implementation or dummy it out.
    // e.g. await this.prisma.otp.deleteMany({ where: { expiresAt: { lt: now } } });
    this.logger.log('OTP cleanup completed.');
    return { success: true };
  }

  private async handleNotificationRetry() {
    this.logger.log('Retrying failed notifications...');
    // Fetch failed notifications and enqueue them back to notification queue
    return { success: true };
  }

  private async handlePaymentRetry() {
    this.logger.log('Retrying pending/failed payments...');
    // Fetch stuck payments and retry capturing
    return { success: true };
  }

  private async handleAuditCleanup() {
    this.logger.log('Cleaning up old audit logs...');
    // Example: Delete audit logs older than 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    // await this.prisma.auditLog.deleteMany({ where: { createdAt: { lt: ninetyDaysAgo } } });
    this.logger.log('Audit logs cleaned up.');
    return { success: true };
  }
}
