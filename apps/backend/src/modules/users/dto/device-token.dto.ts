import { ApiProperty } from '@nestjs/swagger';
import { DevicePlatform } from '@prisma/client';
import { IsEnum, IsString, MaxLength } from 'class-validator';

export class DeviceTokenDto {
  @ApiProperty({ example: 'fcm_or_apns_token' })
  @IsString()
  @MaxLength(500)
  deviceToken!: string;

  @ApiProperty({ enum: DevicePlatform, example: DevicePlatform.ANDROID })
  @IsEnum(DevicePlatform)
  platform!: DevicePlatform;
}

export class DeleteDeviceTokenDto {
  @ApiProperty({ example: 'fcm_or_apns_token' })
  @IsString()
  @MaxLength(500)
  deviceToken!: string;
}
