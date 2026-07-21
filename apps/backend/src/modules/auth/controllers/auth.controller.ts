import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';

import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/auth.interface';
import {
  AdminLoginDto,
  RefreshTokenDto,
  RegisterDeviceDto,
  SendOtpDto,
  VerifyOtpDto,
} from '../dto';
import { AuthService } from '../services/auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ── POST /auth/send-otp ───────────────────────────────────

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send OTP to phone number',
    description: 'Sends a 6-digit OTP to the provided phone number. Rate limited to 1 request per 60 seconds per phone.',
  })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid phone number' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  // ── POST /auth/verify-otp ────────────────────────────────

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify OTP and authenticate',
    description: 'Verifies the OTP and returns access/refresh tokens. Creates a new user if first login.',
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful. Returns tokens and user profile.',
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
  @ApiResponse({ status: 400, description: 'Too many attempts' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  // ── POST /auth/admin/login ───────────────────────────────

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Admin login',
    description: 'Authenticates an admin user with email and password.',
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful. Returns tokens and user profile.',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async adminLogin(@Body() dto: AdminLoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.adminLogin(dto);
    
    // Set HttpOnly cookies for web admin
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth/refresh', // Or '/' if we want it sent everywhere
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return result;
  }

  // ── POST /auth/refresh ───────────────────────────────────

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Exchanges a valid refresh token for a new access/refresh token pair. Old refresh token is invalidated (rotation).',
  })
  @ApiResponse({ status: 200, description: 'New token pair issued' })
  @ApiResponse({ status: 401, description: 'Invalid, expired, or reused refresh token' })
  async refreshTokens(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  // ── POST /auth/logout ────────────────────────────────────

  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout',
    description: 'Revokes all refresh tokens, blacklists the current access token, and deactivates device tokens.',
  })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('authorization') authHeader: string,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    // Clear cookies for web admin
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' });

    // Extract the raw JWT from "Bearer <token>" or from cookie
    let accessToken = authHeader?.replace('Bearer ', '');
    if (!accessToken && req.cookies?.accessToken) {
      accessToken = req.cookies.accessToken;
    }
    
    return this.authService.logout(user.userId, accessToken);
  }

  // ── GET /auth/me ─────────────────────────────────────────

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Returns the authenticated user profile with role-specific data.',
  })
  @ApiResponse({ status: 200, description: 'User profile returned' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getMe(user.userId);
  }

  // ── POST /auth/device ────────────────────────────────────

  @ApiBearerAuth()
  @Post('device')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Register device for push notifications',
    description: 'Registers or updates the FCM/APNS token for the current user device.',
  })
  @ApiResponse({ status: 200, description: 'Device registered' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async registerDevice(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RegisterDeviceDto,
  ) {
    if (!dto.deviceToken || !dto.platform) {
      return { message: 'No device token provided — skipped' };
    }
    return this.authService.registerDevice(user.userId, dto.deviceToken, dto.platform);
  }
}
