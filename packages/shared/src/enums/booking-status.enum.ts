export enum BookingStatus {
  DRAFT = 'DRAFT',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  CONFIRMED = 'CONFIRMED',
  ASSIGNED = 'ASSIGNED',
  ACCEPTED = 'ACCEPTED',
  EN_ROUTE = 'EN_ROUTE',
  ARRIVED = 'ARRIVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

/**
 * Terminal statuses — booking lifecycle has ended.
 */
export const TERMINAL_STATUSES: ReadonlySet<BookingStatus> = new Set([
  BookingStatus.COMPLETED,
  BookingStatus.CANCELLED,
  BookingStatus.FAILED,
]);

/**
 * Active statuses — booking is in progress and requires attention.
 */
export const ACTIVE_STATUSES: ReadonlySet<BookingStatus> = new Set([
  BookingStatus.CONFIRMED,
  BookingStatus.ASSIGNED,
  BookingStatus.ACCEPTED,
  BookingStatus.EN_ROUTE,
  BookingStatus.ARRIVED,
  BookingStatus.IN_PROGRESS,
]);

/**
 * Valid status transitions — enforced at the service layer.
 * Key = current status, Value = set of valid next statuses.
 */
export const BOOKING_STATUS_TRANSITIONS: ReadonlyMap<
  BookingStatus,
  ReadonlySet<BookingStatus>
> = new Map([
  [BookingStatus.DRAFT, new Set([BookingStatus.PENDING_PAYMENT, BookingStatus.CANCELLED])],
  [
    BookingStatus.PENDING_PAYMENT,
    new Set([BookingStatus.CONFIRMED, BookingStatus.FAILED, BookingStatus.CANCELLED]),
  ],
  [BookingStatus.CONFIRMED, new Set([BookingStatus.ASSIGNED, BookingStatus.CANCELLED])],
  [
    BookingStatus.ASSIGNED,
    new Set([BookingStatus.ACCEPTED, BookingStatus.CONFIRMED, BookingStatus.CANCELLED]),
  ],
  [BookingStatus.ACCEPTED, new Set([BookingStatus.EN_ROUTE, BookingStatus.CANCELLED])],
  [BookingStatus.EN_ROUTE, new Set([BookingStatus.ARRIVED, BookingStatus.CANCELLED])],
  [BookingStatus.ARRIVED, new Set([BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED])],
  [BookingStatus.IN_PROGRESS, new Set([BookingStatus.COMPLETED, BookingStatus.FAILED])],
  // Terminal states — no transitions out
  [BookingStatus.COMPLETED, new Set()],
  [BookingStatus.CANCELLED, new Set()],
  [BookingStatus.FAILED, new Set()],
]);
