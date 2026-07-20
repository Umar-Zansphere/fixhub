import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsLatitude, IsLongitude, IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectJobDto {
  @ApiProperty({ example: 'Unable to attend due to prior commitment' })
  @IsString()
  @MaxLength(500)
  reason!: string;
}

export class UpdateJobStatusDto {
  @ApiProperty({ enum: BookingStatus, example: BookingStatus.EN_ROUTE })
  @IsEnum(BookingStatus)
  status!: BookingStatus;

  @ApiPropertyOptional({ example: 'On my way to the location' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

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

  @ApiPropertyOptional({ example: 'Unable to complete due to missing spare part' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  failureReason?: string;
}
