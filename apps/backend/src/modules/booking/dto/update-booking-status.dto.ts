import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsLatitude, IsLongitude, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateBookingStatusDto {
  @ApiProperty({ enum: BookingStatus, example: BookingStatus.ACCEPTED })
  @IsEnum(BookingStatus)
  status!: BookingStatus;

  @ApiPropertyOptional({ example: 'Technician accepted the job.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @ApiPropertyOptional({ example: 'Customer requested cancellation.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cancelReason?: string;

  @ApiPropertyOptional({ example: 'Unable to complete due to missing spare part.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  failureReason?: string;

  @ApiPropertyOptional({ example: 13.0826802 })
  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({ example: 80.2707184 })
  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  longitude?: number;
}
