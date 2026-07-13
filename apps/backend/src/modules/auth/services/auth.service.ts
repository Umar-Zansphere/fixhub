import { ErrorCodes } from '@fixhub/shared';
import { BadRequestException, Injectable, Logger,UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { OTP_ATTEMPTS_PREFIX,OTP_PREFIX } from '../../../common/constants/app.constants';
import { RedisService } from '../../../common/redis/redis.service';
import { generateOtp } from '../../../common/utils/helpers.util';
import { SendOtpDto } from '../dto/send-otp.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { AuthRepository } from '../repositories/auth.repository';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly otpExpiration: number;
  private readonly otpLength: number;
  private readonly maxOtpAttempts = 5;

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly tokenService: TokenService,
    private readonly authRepository: AuthRepository,
  ) {
    this.otpExpiration = this.configService.get<number>('otp.expirationSeconds', 300);
    this.otpLength = this.configService.get<number>('otp.length', 6);
  }

  async sendOtp(dto: SendOtpDto) {
    const otp = generateOtp(this.otpLength);

    // Store OTP in Redis with TTL
    await this.redisService.set(`${OTP_PREFIX}${dto.phone}`, otp, this.otpExpiration);

    // Reset attempt counter
    await this.redisService.del(`${OTP_ATTEMPTS_PREFIX}${dto.phone}`);

    // TODO: Send OTP via SMS provider (BullMQ job)
    this.logger.log(`OTP for ${dto.phone}: ${otp}`); // Dev only — remove in production

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    // Check attempt count
    const attempts = await this.redisService.incr(`${OTP_ATTEMPTS_PREFIX}${dto.phone}`);
    await this.redisService.expire(`${OTP_ATTEMPTS_PREFIX}${dto.phone}`, this.otpExpiration);

    if (attempts > this.maxOtpAttempts) {
      throw new BadRequestException({
        message: 'Too many attempts. Please request a new OTP.',
        errorCode: ErrorCodes.AUTH_OTP_MAX_ATTEMPTS,
      });
    }

    // Verify OTP
    const storedOtp = await this.redisService.get(`${OTP_PREFIX}${dto.phone}`);

    if (!storedOtp) {
      throw new UnauthorizedException({
        message: 'OTP expired. Please request a new one.',
        errorCode: ErrorCodes.AUTH_OTP_EXPIRED,
      });
    }

    if (storedOtp !== dto.otp) {
      throw new UnauthorizedException({
        message: 'Invalid OTP',
        errorCode: ErrorCodes.AUTH_OTP_INVALID,
      });
    }

    // Clean up OTP
    await this.redisService.del(`${OTP_PREFIX}${dto.phone}`);
    await this.redisService.del(`${OTP_ATTEMPTS_PREFIX}${dto.phone}`);

    // Find or create user
    const user = await this.authRepository.findOrCreateUser(dto.phone, dto.role);

    // Generate tokens
    const tokens = await this.tokenService.generateTokenPair(user);

    return {
      ...tokens,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
      },
    };
  }

  async refreshTokens(refreshToken: string) {
    return this.tokenService.refreshTokens(refreshToken);
  }

  async logout(userId: string) {
    await this.tokenService.revokeAllTokens(userId);
    return { message: 'Logged out successfully' };
  }
}
