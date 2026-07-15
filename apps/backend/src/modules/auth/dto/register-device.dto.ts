import { ApiPropertyOptional } from '@nestjs/swagger';
import { DevicePlatform } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class RegisterDeviceDto {
  @ApiPropertyOptional({
    description: 'FCM/APNS push notification token',
    example: 'fCm_token_abc123...',
  })
  @IsOptional()
  @IsString()
  deviceToken?: string;

  @ApiPropertyOptional({
    enum: DevicePlatform,
    example: DevicePlatform.ANDROID,
    description: 'Device platform',
  })
  @IsOptional()
  @IsEnum(DevicePlatform)
  platform?: DevicePlatform;
}
