import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ example: 'sub-service-uuid' })
  @IsUUID()
  subServiceId!: string;

  @ApiProperty({ example: 'address-uuid' })
  @IsUUID()
  addressId!: string;

  @ApiProperty({ example: '2026-07-20' })
  @IsDateString()
  scheduledDate!: string;

  @ApiProperty({ example: '10:00-12:00' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$/)
  scheduledSlot!: string;

  @ApiPropertyOptional({ example: 'Fan is noisy and speed is inconsistent.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

export class BookingSummaryDto extends CreateBookingDto {}

export class ConfirmBookingDto {
  @ApiPropertyOptional({ type: CreateBookingDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateBookingDto)
  booking?: CreateBookingDto;
}

export class AvailableSlotsQueryDto {
  @ApiProperty({ example: 'sub-service-uuid' })
  @IsUUID()
  subServiceId!: string;

  @ApiProperty({ example: '600099' })
  @IsString()
  @MaxLength(10)
  pincode!: string;

  @ApiProperty({ example: '2026-07-20' })
  @IsDateString()
  date!: string;
}
