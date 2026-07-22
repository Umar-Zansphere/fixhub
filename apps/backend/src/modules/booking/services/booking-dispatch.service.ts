import { Injectable, Logger } from '@nestjs/common';
import { BookingStatus, NotificationType, VerificationStatus } from '@prisma/client';

import { PrismaService } from '../../../common/database/prisma.service';
import { NotificationService } from '../../notification/services/notification.service';
import { JobOfferRepository } from '../../technician/repositories/job-offer.repository';

/** Maximum number of technicians to broadcast an offer to per booking. */
const MAX_BROADCAST_SIZE = 5;

@Injectable()
export class BookingDispatchService {
  private readonly logger = new Logger(BookingDispatchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jobOfferRepository: JobOfferRepository,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Find eligible technicians for the booking and broadcast job offers.
   * Called after payment is captured (booking status = CONFIRMED).
   *
   * Eligibility criteria:
   *  - verificationStatus = VERIFIED
   *  - isAvailable = true
   *  - has a TechnicianServiceArea matching the booking's address pincode
   *  - has a TechnicianSpecialization matching the booking's subServiceId
   *  - has no currently active job (ACCEPTED, EN_ROUTE, ARRIVED, IN_PROGRESS)
   */
  async dispatch(bookingId: string): Promise<void> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { address: true },
    });

    if (!booking) {
      this.logger.warn(`Dispatch called for non-existent booking ${bookingId}`);
      return;
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      this.logger.warn(
        `Dispatch skipped for booking ${bookingId} — status is ${booking.status}, expected CONFIRMED`,
      );
      return;
    }

    const eligibleTechnicians = await this.findEligibleTechnicians(
      booking.address.pincode,
      booking.subServiceId,
    );

    if (eligibleTechnicians.length === 0) {
      this.logger.warn(
        `No eligible technicians found for booking ${bookingId} (pincode: ${booking.address.pincode}, subService: ${booking.subServiceId})`,
      );
      await this.alertAdminNoTechnicians(booking);
      return;
    }

    const technicianIds = eligibleTechnicians
      .slice(0, MAX_BROADCAST_SIZE)
      .map((t) => t.id);

    this.logger.log(
      `Dispatching booking ${booking.bookingNumber} to ${technicianIds.length} technician(s)`,
    );

    // Create job offers in DB (15-min TTL per offer)
    await this.jobOfferRepository.createOffers(bookingId, technicianIds);

    // Push notification to each eligible technician (fire-and-forget per technician)
    await Promise.allSettled(
      eligibleTechnicians.slice(0, MAX_BROADCAST_SIZE).map((tech) =>
        this.notificationService.sendPushNotification({
          userId: tech.userId,
          title: '🔔 New Job Available',
          body: `A new ${booking.bookingNumber} job is available near you. Tap to view and accept within 15 minutes.`,
          type: NotificationType.ASSIGNMENT,
          payload: { bookingId, screen: 'job_offer' },
        }).catch((err) =>
          this.logger.warn(`Failed to notify technician ${tech.userId}: ${err.message}`),
        ),
      ),
    );
  }

  /**
   * Core matching query.
   * Returns technician records with their userId for notification purposes.
   */
  private async findEligibleTechnicians(
    pincode: string,
    subServiceId: string,
  ): Promise<Array<{ id: string; userId: string }>> {
    const activeJobStatuses: BookingStatus[] = [
      BookingStatus.ACCEPTED,
      BookingStatus.EN_ROUTE,
      BookingStatus.ARRIVED,
      BookingStatus.IN_PROGRESS,
    ];

    return this.prisma.technician.findMany({
      where: {
        verificationStatus: VerificationStatus.VERIFIED,
        isAvailable: true,
        deletedAt: null,
        user: { isActive: true, deletedAt: null },
        // Must serve the booking's pincode
        serviceAreas: {
          some: {
            serviceArea: { pincode, isActive: true, deletedAt: null },
          },
        },
        // Must be specialised in the required sub-service
        specializations: {
          some: { subServiceId },
        },
        // Must not have an active job right now
        bookings: {
          none: {
            status: { in: activeJobStatuses },
          },
        },
      },
      select: { id: true, userId: true },
      // Prefer highly-rated technicians; secondary sort by most recently active
      orderBy: [{ rating: 'desc' }, { lastLocationAt: 'desc' }],
    });
  }

  /**
   * Sends an alert notification to all ADMIN users when no technician can be matched.
   */
  private async alertAdminNoTechnicians(booking: {
    id: string;
    bookingNumber: string;
    address: { pincode: string };
    subServiceId: string;
  }): Promise<void> {
    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true, deletedAt: null },
      select: { id: true },
    });

    await Promise.allSettled(
      admins.map((admin) =>
        this.notificationService.sendPushNotification({
          userId: admin.id,
          title: '⚠️ No Technician Available',
          body: `Booking ${booking.bookingNumber} (pincode: ${booking.address.pincode}) has no eligible technicians or all offers expired. Manual assignment required.`,
          type: NotificationType.SYSTEM,
          payload: { bookingId: booking.id, screen: 'admin_booking_detail' },
        }).catch((err) =>
          this.logger.warn(`Failed to alert admin ${admin.id}: ${err.message}`),
        ),
      ),
    );
  }

  /**
   * Checks for CONFIRMED bookings that have no PENDING or ACCEPTED job offers
   * (meaning all offers have expired or been rejected) and alerts admins.
   * Called periodically by the job scheduler.
   */
  async checkOrphanedBookings(): Promise<number> {
    const orphanedBookings = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.CONFIRMED,
        jobOffers: {
          none: {
            status: { in: ['PENDING', 'ACCEPTED'] },
          },
        },
      },
      include: { address: true },
    });

    for (const booking of orphanedBookings) {
      this.logger.warn(
        `Booking ${booking.bookingNumber} is orphaned (all offers expired/rejected). Alerting admins.`,
      );
      await this.alertAdminNoTechnicians(booking);
    }

    return orphanedBookings.length;
  }
}
