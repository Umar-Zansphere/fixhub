import { ErrorCodes } from '@fixhub/shared';
import { Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';

import { AuthenticatedUser } from '../../../common/interfaces/auth.interface';
import { UpdateBookingStatusDto } from '../dto';
import { BookingStateMachineService } from '../lifecycle/booking-state-machine.service';
import { BookingRepository } from '../repositories/booking.repository';
import { BookingQueryCacheService } from './booking-query-cache.service';

@Injectable()
export class BookingLifecycleService {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly stateMachine: BookingStateMachineService,
    private readonly bookingQueryCacheService: BookingQueryCacheService,
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

  private defaultTimelineNote(from: BookingStatus, to: BookingStatus) {
    return `Booking status changed from ${from} to ${to}`;
  }

  private toJson(value: unknown) {
    return JSON.parse(JSON.stringify(value));
  }
}
