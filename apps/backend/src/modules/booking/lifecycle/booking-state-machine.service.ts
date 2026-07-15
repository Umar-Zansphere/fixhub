import { ErrorCodes } from '@fixhub/shared';
import { BadRequestException, Injectable } from '@nestjs/common';
import { BookingStatus, Role } from '@prisma/client';

import { BookingTransitionContext, BookingTransitionDefinition } from './booking-transition.types';
import {
  ActorRoleValidator,
  AssignedTechnicianRequiredValidator,
  CancellationReasonValidator,
  CustomerOwnsBookingValidator,
  FailureReasonValidator,
  TechnicianOwnsBookingValidator,
} from './transition-validators';

@Injectable()
export class BookingStateMachineService {
  private readonly customerOwnsBooking = new CustomerOwnsBookingValidator();
  private readonly technicianOwnsBooking = new TechnicianOwnsBookingValidator();
  private readonly assignedTechnicianRequired = new AssignedTechnicianRequiredValidator();
  private readonly cancellationReason = new CancellationReasonValidator();
  private readonly failureReason = new FailureReasonValidator();

  private readonly transitions = new Map<string, BookingTransitionDefinition>(
    [
      this.define(BookingStatus.DRAFT, BookingStatus.PENDING_PAYMENT, [Role.CUSTOMER, Role.ADMIN], [
        this.customerOwnsBooking,
      ]),
      this.define(BookingStatus.DRAFT, BookingStatus.CANCELLED, [Role.CUSTOMER, Role.ADMIN], [
        this.customerOwnsBooking,
        this.cancellationReason,
      ]),
      this.define(BookingStatus.PENDING_PAYMENT, BookingStatus.CONFIRMED, [Role.ADMIN], []),
      this.define(BookingStatus.PENDING_PAYMENT, BookingStatus.FAILED, [Role.ADMIN], [
        this.failureReason,
      ]),
      this.define(BookingStatus.PENDING_PAYMENT, BookingStatus.CANCELLED, [Role.CUSTOMER, Role.ADMIN], [
        this.customerOwnsBooking,
        this.cancellationReason,
      ]),
      this.define(BookingStatus.CONFIRMED, BookingStatus.ASSIGNED, [Role.ADMIN], [
        this.assignedTechnicianRequired,
      ]),
      this.define(BookingStatus.CONFIRMED, BookingStatus.CANCELLED, [Role.CUSTOMER, Role.ADMIN], [
        this.customerOwnsBooking,
        this.cancellationReason,
      ]),
      this.define(BookingStatus.ASSIGNED, BookingStatus.ACCEPTED, [Role.TECHNICIAN, Role.ADMIN], [
        this.assignedTechnicianRequired,
        this.technicianOwnsBooking,
      ]),
      this.define(BookingStatus.ASSIGNED, BookingStatus.CONFIRMED, [Role.ADMIN], []),
      this.define(BookingStatus.ASSIGNED, BookingStatus.CANCELLED, [Role.CUSTOMER, Role.ADMIN], [
        this.customerOwnsBooking,
        this.cancellationReason,
      ]),
      this.define(BookingStatus.ACCEPTED, BookingStatus.EN_ROUTE, [Role.TECHNICIAN, Role.ADMIN], [
        this.assignedTechnicianRequired,
        this.technicianOwnsBooking,
      ]),
      this.define(BookingStatus.ACCEPTED, BookingStatus.CANCELLED, [Role.CUSTOMER, Role.ADMIN], [
        this.customerOwnsBooking,
        this.cancellationReason,
      ]),
      this.define(BookingStatus.EN_ROUTE, BookingStatus.ARRIVED, [Role.TECHNICIAN, Role.ADMIN], [
        this.assignedTechnicianRequired,
        this.technicianOwnsBooking,
      ]),
      this.define(BookingStatus.EN_ROUTE, BookingStatus.CANCELLED, [Role.CUSTOMER, Role.ADMIN], [
        this.customerOwnsBooking,
        this.cancellationReason,
      ]),
      this.define(BookingStatus.ARRIVED, BookingStatus.IN_PROGRESS, [Role.TECHNICIAN, Role.ADMIN], [
        this.assignedTechnicianRequired,
        this.technicianOwnsBooking,
      ]),
      this.define(BookingStatus.ARRIVED, BookingStatus.CANCELLED, [Role.CUSTOMER, Role.ADMIN], [
        this.customerOwnsBooking,
        this.cancellationReason,
      ]),
      this.define(BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED, [Role.TECHNICIAN, Role.ADMIN], [
        this.assignedTechnicianRequired,
        this.technicianOwnsBooking,
      ]),
      this.define(BookingStatus.IN_PROGRESS, BookingStatus.FAILED, [Role.TECHNICIAN, Role.ADMIN], [
        this.assignedTechnicianRequired,
        this.technicianOwnsBooking,
        this.failureReason,
      ]),
    ].map((transition) => [this.key(transition.from, transition.to), transition]),
  );

  validate(context: BookingTransitionContext): BookingTransitionDefinition {
    const transition = this.transitions.get(this.key(context.booking.status, context.dto.status));

    if (!transition) {
      throw new BadRequestException({
        message: `Cannot transition booking from ${context.booking.status} to ${context.dto.status}`,
        errorCode: ErrorCodes.BOOKING_INVALID_TRANSITION,
      });
    }

    [new ActorRoleValidator(transition.allowedRoles), ...transition.validators].forEach((validator) =>
      validator.validate(context),
    );

    return transition;
  }

  getAllowedTransitions(status: BookingStatus): BookingStatus[] {
    return Array.from(this.transitions.values())
      .filter((transition) => transition.from === status)
      .map((transition) => transition.to);
  }

  private define(
    from: BookingStatus,
    to: BookingStatus,
    allowedRoles: Role[],
    validators: BookingTransitionDefinition['validators'],
  ): BookingTransitionDefinition {
    return { from, to, allowedRoles, validators };
  }

  private key(from: BookingStatus, to: BookingStatus) {
    return `${from}:${to}`;
  }
}
