import { Role } from '@prisma/client';

export const ROLES = {
  CUSTOMER: Role.CUSTOMER,
  TECHNICIAN: Role.TECHNICIAN,
  ADMIN: Role.ADMIN,
} as const;

export const TIME_SLOTS = [
  '08:00-10:00',
  '10:00-12:00',
  '12:00-14:00',
  '14:00-16:00',
  '16:00-18:00',
  '18:00-20:00',
] as const;

export const BOOKING_NUMBER_PREFIX = 'FH';

export const MAX_MEDIA_PER_BOOKING = 5;
export const MAX_FILE_SIZE_MB = 10;

export const OTP_PREFIX = 'otp:';
export const OTP_ATTEMPTS_PREFIX = 'otp_attempts:';
export const RATE_LIMIT_PREFIX = 'rate_limit:';
export const BOOKING_LOCK_PREFIX = 'booking_lock:';
