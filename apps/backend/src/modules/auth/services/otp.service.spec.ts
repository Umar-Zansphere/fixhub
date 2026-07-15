import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { OtpService } from './otp.service';
import { RedisService } from '../../../common/redis/redis.service';

describe('OtpService', () => {
  let otpService: OtpService;
  let redisService: jest.Mocked<RedisService>;

  const mockRedisClient = {
    ttl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config: Record<string, any> = {
                'otp.expirationSeconds': 300,
                'otp.length': 6,
                'nodeEnv': 'test',
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            exists: jest.fn(),
            incr: jest.fn(),
            expire: jest.fn(),
            getClient: jest.fn(() => mockRedisClient),
          },
        },
      ],
    }).compile();

    otpService = module.get<OtpService>(OtpService);
    redisService = module.get(RedisService);
  });

  it('should be defined', () => {
    expect(otpService).toBeDefined();
  });

  // ── generateAndStore ──────────────────────────────────

  describe('generateAndStore', () => {
    it('should generate and store OTP when no cooldown', async () => {
      redisService.exists.mockResolvedValue(false);
      redisService.set.mockResolvedValue(undefined);
      redisService.del.mockResolvedValue(undefined);

      const result = await otpService.generateAndStore('+919876543210');

      expect(result.otp).toHaveLength(6);
      expect(result.otp).toMatch(/^\d{6}$/);
      expect(result.expiresInSeconds).toBe(300);
      // Should store hashed OTP
      expect(redisService.set).toHaveBeenCalledWith(
        'otp:+919876543210',
        expect.any(String),
        300,
      );
      // Should set cooldown
      expect(redisService.set).toHaveBeenCalledWith(
        'otp_cooldown:+919876543210',
        '1',
        60,
      );
      // Should reset attempts
      expect(redisService.del).toHaveBeenCalledWith('otp_attempts:+919876543210');
    });

    it('should return empty OTP when on cooldown', async () => {
      redisService.exists.mockResolvedValue(true);
      mockRedisClient.ttl.mockResolvedValue(45);

      const result = await otpService.generateAndStore('+919876543210');

      expect(result.otp).toBe('');
      expect(result.expiresInSeconds).toBe(45);
    });
  });

  // ── verify ────────────────────────────────────────────

  describe('verify', () => {
    it('should return valid for correct OTP', async () => {
      redisService.incr.mockResolvedValue(1);
      redisService.expire.mockResolvedValue(undefined);
      // generateAndStore stores hash of the OTP
      const crypto = require('crypto');
      const hash = crypto.createHash('sha256').update('123456').digest('hex');
      redisService.get.mockResolvedValue(hash);
      redisService.del.mockResolvedValue(undefined);

      const result = await otpService.verify('+919876543210', '123456');

      expect(result.valid).toBe(true);
      // Should cleanup keys
      expect(redisService.del).toHaveBeenCalledWith('otp:+919876543210');
      expect(redisService.del).toHaveBeenCalledWith('otp_attempts:+919876543210');
      expect(redisService.del).toHaveBeenCalledWith('otp_cooldown:+919876543210');
    });

    it('should return INVALID for wrong OTP', async () => {
      redisService.incr.mockResolvedValue(1);
      redisService.expire.mockResolvedValue(undefined);
      const crypto = require('crypto');
      const hash = crypto.createHash('sha256').update('123456').digest('hex');
      redisService.get.mockResolvedValue(hash);

      const result = await otpService.verify('+919876543210', '999999');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('INVALID');
      expect(result.remainingAttempts).toBe(4);
    });

    it('should return EXPIRED when no OTP in Redis', async () => {
      redisService.incr.mockResolvedValue(1);
      redisService.expire.mockResolvedValue(undefined);
      redisService.get.mockResolvedValue(null);

      const result = await otpService.verify('+919876543210', '123456');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('EXPIRED');
    });

    it('should return MAX_ATTEMPTS when attempts exceeded', async () => {
      redisService.incr.mockResolvedValue(6); // > 5
      redisService.expire.mockResolvedValue(undefined);
      redisService.del.mockResolvedValue(undefined);

      const result = await otpService.verify('+919876543210', '123456');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('MAX_ATTEMPTS');
      expect(result.remainingAttempts).toBe(0);
    });

    it('should track attempts correctly across multiple calls', async () => {
      const crypto = require('crypto');
      const hash = crypto.createHash('sha256').update('123456').digest('hex');

      // First attempt — wrong OTP
      redisService.incr.mockResolvedValueOnce(1);
      redisService.expire.mockResolvedValue(undefined);
      redisService.get.mockResolvedValue(hash);

      const r1 = await otpService.verify('+919876543210', '111111');
      expect(r1.valid).toBe(false);
      expect(r1.remainingAttempts).toBe(4);

      // Third attempt — correct OTP
      redisService.incr.mockResolvedValueOnce(3);
      redisService.del.mockResolvedValue(undefined);

      const r2 = await otpService.verify('+919876543210', '123456');
      expect(r2.valid).toBe(true);
    });
  });

  // ── cleanup ───────────────────────────────────────────

  describe('cleanup', () => {
    it('should delete all OTP-related keys', async () => {
      redisService.del.mockResolvedValue(undefined);

      await otpService.cleanup('+919876543210');

      expect(redisService.del).toHaveBeenCalledTimes(3);
      expect(redisService.del).toHaveBeenCalledWith('otp:+919876543210');
      expect(redisService.del).toHaveBeenCalledWith('otp_attempts:+919876543210');
      expect(redisService.del).toHaveBeenCalledWith('otp_cooldown:+919876543210');
    });
  });
});
