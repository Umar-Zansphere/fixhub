import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { RedisService } from '../../../common/redis/redis.service';
import { generateOtp, hashString } from '../../../common/utils/helpers.util';

/**
 * Redis key patterns:
 *   otp:{phone}           → hashed OTP value     (TTL: 300s)
 *   otp_attempts:{phone}  → attempt counter       (TTL: 300s)
 *   otp_cooldown:{phone}  → resend cooldown flag  (TTL: 60s)
 */
const OTP_PREFIX = 'otp:';
const OTP_ATTEMPTS_PREFIX = 'otp_attempts:';
const OTP_COOLDOWN_PREFIX = 'otp_cooldown:';
const OTP_LOCKOUT_PREFIX = 'otp_lockout:';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly otpExpiration: number;
  private readonly otpLength: number;
  private readonly maxAttempts: number;
  private readonly cooldownSeconds: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    this.otpExpiration = this.configService.get<number>('otp.expirationSeconds', 300);
    this.otpLength = this.configService.get<number>('otp.length', 6);
    this.maxAttempts = 5;
    this.cooldownSeconds = 60;
  }

  /**
   * Generate and store a new OTP for the given phone number.
   *
   * Security measures:
   * 1. OTP is hashed before storing in Redis (SHA-256)
   * 2. Resend cooldown prevents spam (60s)
   * 3. Attempt counter is reset on new OTP
   *
   * @returns The plaintext OTP (for SMS delivery)
   * @throws if cooldown period has not elapsed
   */
  async generateAndStore(phone: string): Promise<{
    otp: string;
    expiresInSeconds: number;
    isResend: boolean;
  }> {
    // Check lockout
    const lockoutKey = `${OTP_LOCKOUT_PREFIX}${phone}`;
    const lockoutTtl = await this.redisService.getClient().ttl(lockoutKey);
    if (lockoutTtl > 0) {
      throw new ForbiddenException(`Too many attempts. Please try again after ${Math.ceil(lockoutTtl / 60)} minutes.`);
    }

    // Check resend cooldown
    const cooldownKey = `${OTP_COOLDOWN_PREFIX}${phone}`;
    const isOnCooldown = await this.redisService.exists(cooldownKey);

    const otpKey = `${OTP_PREFIX}${phone}`;
    const attemptsKey = `${OTP_ATTEMPTS_PREFIX}${phone}`;

    // If on cooldown, check if there's an existing OTP still valid
    if (isOnCooldown) {
      const ttl = await this.redisService.getClient().ttl(cooldownKey);
      return {
        otp: '', // Don't regenerate — existing OTP is still valid
        expiresInSeconds: ttl > 0 ? ttl : this.cooldownSeconds,
        isResend: false,
      };
    }

    // Generate new OTP
    const otp = generateOtp(this.otpLength);
    const hashedOtp = hashString(otp);

    // Store hashed OTP in Redis
    await this.redisService.set(otpKey, hashedOtp, this.otpExpiration);

    // Reset attempt counter
    await this.redisService.del(attemptsKey);

    // Set resend cooldown
    await this.redisService.set(cooldownKey, '1', this.cooldownSeconds);

    // Dev-only logging — remove in production
    if (this.configService.get<string>('nodeEnv') === 'development') {
      this.logger.debug(`[DEV] OTP for ${phone}: ${otp}`);
    }

    return {
      otp,
      expiresInSeconds: this.otpExpiration,
      isResend: false,
    };
  }

  /**
   * Verify an OTP for the given phone number.
   *
   * Security measures:
   * 1. Compare hashed values only
   * 2. Track and limit verification attempts (max 5)
   * 3. Delete OTP and counters on success
   *
   * @returns { valid: true } on success
   * @returns { valid: false, reason: string } on failure
   */
  async verify(phone: string, otp: string): Promise<{
    valid: boolean;
    reason?: 'EXPIRED' | 'INVALID' | 'MAX_ATTEMPTS';
    remainingAttempts?: number;
  }> {
    const otpKey = `${OTP_PREFIX}${phone}`;
    const attemptsKey = `${OTP_ATTEMPTS_PREFIX}${phone}`;

    // Check attempt count FIRST (before revealing if OTP exists)
    const attempts = await this.redisService.incr(attemptsKey);
    await this.redisService.expire(attemptsKey, this.otpExpiration);

    if (attempts > this.maxAttempts) {
      // Set lockout (e.g. 30 minutes)
      const lockoutKey = `${OTP_LOCKOUT_PREFIX}${phone}`;
      await this.redisService.set(lockoutKey, '1', 30 * 60);

      // Wipe the OTP to force re-request
      await this.cleanup(phone);
      return { valid: false, reason: 'MAX_ATTEMPTS', remainingAttempts: 0 };
    }

    // Get stored hashed OTP
    const storedHashedOtp = await this.redisService.get(otpKey);

    if (!storedHashedOtp) {
      return {
        valid: false,
        reason: 'EXPIRED',
        remainingAttempts: this.maxAttempts - attempts,
      };
    }

    // Compare hashes
    const inputHash = hashString(otp);

    if (inputHash !== storedHashedOtp) {
      return {
        valid: false,
        reason: 'INVALID',
        remainingAttempts: this.maxAttempts - attempts,
      };
    }

    // Success — cleanup all OTP keys
    await this.cleanup(phone);
    return { valid: true };
  }

  /**
   * Remove all OTP-related keys for a phone number.
   */
  async cleanup(phone: string): Promise<void> {
    await Promise.all([
      this.redisService.del(`${OTP_PREFIX}${phone}`),
      this.redisService.del(`${OTP_ATTEMPTS_PREFIX}${phone}`),
      this.redisService.del(`${OTP_COOLDOWN_PREFIX}${phone}`),
    ]);
  }

  /**
   * Check remaining resend cooldown time.
   * Returns 0 if no cooldown.
   */
  async getCooldownRemaining(phone: string): Promise<number> {
    const ttl = await this.redisService.getClient().ttl(`${OTP_COOLDOWN_PREFIX}${phone}`);
    return ttl > 0 ? ttl : 0;
  }
}
