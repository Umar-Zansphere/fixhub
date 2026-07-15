import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export enum NotificationChannel {
  PUSH = 'PUSH',
  SMS = 'SMS',
  EMAIL = 'EMAIL',
}

export class NotificationTemplateDto {
  @ApiProperty({ example: 'booking.confirmed' })
  @IsString()
  @MaxLength(120)
  key!: string;

  @ApiProperty({ example: 'Booking confirmed' })
  @IsString()
  @MaxLength(160)
  title!: string;

  @ApiProperty({ example: 'Your booking {{bookingNumber}} is confirmed.' })
  @IsString()
  @MaxLength(1000)
  body!: string;
}

export class SendNotificationDto {
  @ApiProperty({ example: 'user-uuid' })
  @IsUUID()
  userId!: string;

  @ApiPropertyOptional({ enum: NotificationType, default: NotificationType.SYSTEM })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({ example: 'Booking confirmed' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @ApiPropertyOptional({ example: 'Your booking is confirmed.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  body?: string;

  @ApiPropertyOptional({ example: 'booking.confirmed' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  templateKey?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  variables?: Record<string, string | number | boolean>;

  @ApiPropertyOptional({ enum: NotificationChannel, isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @IsEnum(NotificationChannel, { each: true })
  channels?: NotificationChannel[];

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}

export class NotificationPreferencesDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  push?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  sms?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  email?: boolean;

  @ApiPropertyOptional({ enum: NotificationType, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationType, { each: true })
  mutedTypes?: NotificationType[];
}

export class UpsertTemplateDto {
  @ApiProperty({ type: NotificationTemplateDto })
  @ValidateNested()
  @Type(() => NotificationTemplateDto)
  template!: NotificationTemplateDto;
}
