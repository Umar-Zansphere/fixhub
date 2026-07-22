import { ErrorCodes } from '@fixhub/shared';
import { Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { BookingStatus, NotificationType } from '@prisma/client';

import { AuthenticatedUser } from '../../../common/interfaces/auth.interface';
import { NotificationService } from '../../notification/services/notification.service';
import { TrackingGateway } from '../../tracking/tracking.gateway';
import { UpdateBookingStatusDto } from '../dto';
import { BookingStateMachineService } from '../lifecycle/booking-state-machine.service';
import { BookingRepository } from '../repositories/booking.repository';
import { BookingQueryCacheService } from './booking-query-cache.service';

/** Maps a booking status transition to the notification to fire. */
interface TransitionNotification {
  /** userId to notify */
  recipientUserId: string;
  title: string;
  body: string;
  type: NotificationType;
  payload?: Record<string, unknown>;
}

@Injectable()
export class BookingLifecycleService {
  private readonly logger = new Logger(BookingLifecycleService.name);

  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly stateMachine: BookingStateMachineService,
    private readonly bookingQueryCacheService: BookingQueryCacheService,
    private readonly notificationService: NotificationService,
    @Optional() private readonly trackingGateway: TrackingGateway,
  ) {}

  async transition(bookingId: string, actor: AuthenticatedUser, dto: UpdateBookingStatusDto) {
    const booking = await this.bookingRepository.findByIdForLifecycle(bookingId);

    if (!booking) {
      throw new NotFoundException({
        message: 'Booking not found',
        errorCode: ErrorCodes.BOOKING_NOT_FOUND,
      });
    }

    const transition = this.stateMachine.validate({
      booking,
      actor,
      dto,
    });

    const updated = await this.bookingRepository.transaction(async (tx) => {
      const transitioned = await this.bookingRepository.updateLifecycleStatus(
        tx,
        bookingId,
        dto,
        actor.userId,
        actor.role,
      );

      await this.bookingRepository.createTimelineEntry(tx, {
        bookingId,
        status: dto.status,
        changedByUserId: actor.userId,
        note: dto.note ?? this.defaultTimelineNote(transition.from, transition.to),
        latitude: dto.latitude,
        longitude: dto.longitude,
      });

      await this.bookingRepository.createAuditLog(tx, {
        userId: actor.userId,
        entityId: bookingId,
        oldValue: this.toJson({
          status: transition.from,
          cancelledAt: booking.cancelledAt,
          completedAt: booking.completedAt,
          failedAt: booking.failedAt,
        }),
        newValue: this.toJson({
          status: transition.to,
          cancelReason: dto.cancelReason,
          failureReason: dto.failureReason,
          note: dto.note,
        }),
      });

      return transitioned;
    });

    await this.bookingQueryCacheService.invalidate();

    // Broadcast real-time status update over WebSocket (fire-and-forget)
    if (this.trackingGateway) {
      try {
        this.trackingGateway.broadcastStatusUpdate(bookingId, dto.status);
      } catch (err: any) {
        this.logger.warn(`WS broadcast failed for booking ${bookingId}: ${err.message}`);
      }
    }

    // Fire notifications asynchronously — failures must never break the transition
    this.sendTransitionNotifications(updated, transition.to).catch((err) =>
      this.logger.error(
        `Notification dispatch failed for booking ${bookingId} → ${transition.to}: ${err.message}`,
      ),
    );

    return {
      booking: updated,
      transition: {
        from: transition.from,
        to: transition.to,
        allowedNextStatuses: this.stateMachine.getAllowedTransitions(dto.status),
      },
    };
  }

  getAllowedTransitions(status: BookingStatus) {
    return this.stateMachine.getAllowedTransitions(status);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Notification helpers
  // ─────────────────────────────────────────────────────────────────────────

  private async sendTransitionNotifications(booking: any, newStatus: BookingStatus): Promise<void> {
    const notifications = this.buildNotifications(booking, newStatus);
    await Promise.allSettled(
      notifications.map((n) =>
        this.notificationService.sendPushNotification({
          userId: n.recipientUserId,
          title: n.title,
          body: n.body,
          type: n.type,
          payload: n.payload,
        }),
      ),
    );
  }

  private buildNotifications(booking: any, status: BookingStatus): TransitionNotification[] {
    const bookingRef = booking.bookingNumber ?? booking.id;
    const customerUserId: string | undefined = booking.customer?.userId;
    const technicianUserId: string | undefined = booking.technician?.userId;
    const payload = { bookingId: booking.id, status };

    switch (status) {
      case BookingStatus.ASSIGNED:
        if (!technicianUserId) return [];
        return [
          {
            recipientUserId: technicianUserId,
            title: 'New Job Assigned',
            body: `Booking ${bookingRef} has been assigned to you. Please accept or reject within 15 minutes.`,
            type: NotificationType.ASSIGNMENT,
            payload,
          },
        ];

      case BookingStatus.ACCEPTED:
        if (!customerUserId) return [];
        return [
          {
            recipientUserId: customerUserId,
            title: 'Technician Accepted',
            body: `Your technician has accepted booking ${bookingRef} and will arrive at the scheduled time.`,
            type: NotificationType.BOOKING_UPDATE,
            payload,
          },
        ];

      case BookingStatus.EN_ROUTE:
        if (!customerUserId) return [];
        return [
          {
            recipientUserId: customerUserId,
            title: 'Technician On the Way',
            body: `Your technician is on the way for booking ${bookingRef}.`,
            type: NotificationType.BOOKING_UPDATE,
            payload,
          },
        ];

      case BookingStatus.ARRIVED:
        if (!customerUserId) return [];
        return [
          {
            recipientUserId: customerUserId,
            title: 'Technician Arrived',
            body: `Your technician has arrived for booking ${bookingRef}.`,
            type: NotificationType.BOOKING_UPDATE,
            payload,
          },
        ];

      case BookingStatus.IN_PROGRESS:
        if (!customerUserId) return [];
        return [
          {
            recipientUserId: customerUserId,
            title: 'Service Started',
            body: `The service for booking ${bookingRef} has started.`,
            type: NotificationType.BOOKING_UPDATE,
            payload,
          },
        ];

      case BookingStatus.COMPLETED:
        if (!customerUserId) return [];
        return [
          {
            recipientUserId: customerUserId,
            title: 'Service Completed ✅',
            body: `Booking ${bookingRef} is complete. How was the experience? Please leave a rating.`,
            type: NotificationType.BOOKING_UPDATE,
            payload: { ...payload, screen: 'rating' },
          },
        ];

      case BookingStatus.CANCELLED: {
        const targets: TransitionNotification[] = [];
        if (customerUserId) {
          targets.push({
            recipientUserId: customerUserId,
            title: 'Booking Cancelled',
            body: `Booking ${bookingRef} has been cancelled.`,
            type: NotificationType.BOOKING_UPDATE,
            payload,
          });
        }
        if (technicianUserId) {
          targets.push({
            recipientUserId: technicianUserId,
            title: 'Job Cancelled',
            body: `Job ${bookingRef} has been cancelled.`,
            type: NotificationType.BOOKING_UPDATE,
            payload,
          });
        }
        return targets;
      }

      case BookingStatus.FAILED:
        if (!customerUserId) return [];
        return [
          {
            recipientUserId: customerUserId,
            title: 'Service Could Not Be Completed',
            body: `Unfortunately, booking ${bookingRef} could not be completed. Our team will reach out to you.`,
            type: NotificationType.BOOKING_UPDATE,
            payload,
          },
        ];

      default:
        return [];
    }
  }

  private defaultTimelineNote(from: BookingStatus, to: BookingStatus) {
    return `Booking status changed from ${from} to ${to}`;
  }

  private toJson(value: unknown) {
    return JSON.parse(JSON.stringify(value));
  }
}
