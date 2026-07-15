import { Booking, BookingStatus, Role } from '@prisma/client';

import { AuthenticatedUser } from '../../../common/interfaces/auth.interface';
import { UpdateBookingStatusDto } from '../dto';

export type BookingWithLifecycleRelations = Booking & {
  customer?: { userId: string } | null;
  technician?: { userId: string } | null;
};

export interface BookingTransitionContext {
  booking: BookingWithLifecycleRelations;
  actor: AuthenticatedUser;
  dto: UpdateBookingStatusDto;
}

export interface BookingTransitionValidator {
  validate(context: BookingTransitionContext): void;
}

export interface BookingTransitionDefinition {
  from: BookingStatus;
  to: BookingStatus;
  allowedRoles: Role[];
  validators: BookingTransitionValidator[];
}
