import * as crypto from 'crypto';

/**
 * Generate a random numeric OTP of specified length
 */
export function generateOtp(length: number = 6): string {
  const digits = '0123456789';
  let otp = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    otp += digits[bytes[i] % 10];
  }
  return otp;
}

/**
 * Generate a unique booking number
 * Format: FH-YYYYMMDD-XXXX (e.g., FH-20250101-0042)
 */
export function generateBookingNumber(sequence: number): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(sequence).padStart(4, '0');
  return `FH-${date}-${seq}`;
}

/**
 * Hash a string using SHA256
 */
export function hashString(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}
