import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MediaType, MediaUploadPhase } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateBookingMediaDto {
  @ApiProperty({ example: 'issue-photo.jpg', maxLength: 180 })
  @IsString()
  @MaxLength(180)
  fileName!: string;

  @ApiProperty({ example: 'image/jpeg', maxLength: 80 })
  @IsString()
  @MaxLength(80)
  contentType!: string;

  @ApiPropertyOptional({
    example: 5242880,
    description: 'Client-side file size in bytes. Images max 10MB, videos max 100MB.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(104_857_600)
  sizeBytes?: number;

  @ApiPropertyOptional({
    example: 45,
    description: 'Duration of the video in seconds. Required for VIDEO type. Max 60 seconds (SRS §2.4).',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  durationSeconds?: number;

  @ApiPropertyOptional({ enum: MediaType, default: MediaType.IMAGE })
  @IsOptional()
  @IsEnum(MediaType)
  type?: MediaType;

  @ApiPropertyOptional({
    enum: MediaUploadPhase,
    default: MediaUploadPhase.BEFORE_SERVICE,
  })
  @IsOptional()
  @IsEnum(MediaUploadPhase)
  uploadPhase?: MediaUploadPhase;

  @ApiPropertyOptional({
    description: 'Public URL to persist once the client has uploaded the object',
    example: 'https://cdn.fixhub.in/bookings/booking-id/photo.jpg',
  })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(1000)
  url?: string;
}

export class CreateBookingMediaBatchDto {
  @ApiProperty({ type: [CreateBookingMediaDto], maxItems: 10 })
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => CreateBookingMediaDto)
  files!: CreateBookingMediaDto[];
}
