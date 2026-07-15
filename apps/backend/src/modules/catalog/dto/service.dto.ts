import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ example: 'category-uuid' })
  @IsString()
  categoryId!: string;

  @ApiProperty({ example: 'Fan Repair', maxLength: 140 })
  @IsString()
  @MaxLength(140)
  name!: string;

  @ApiPropertyOptional({ example: 'fan-repair', maxLength: 160 })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  slug?: string;

  @ApiPropertyOptional({ example: 'Ceiling fan inspection, repair, and replacement support.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: 499 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99999999)
  basePrice!: number;

  @ApiProperty({ example: 60 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1440)
  estimatedDurationMins!: number;

  @ApiPropertyOptional({ example: 'https://cdn.fixhub.in/icons/fan-repair.png' })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(1000)
  iconUrl?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 10, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10000)
  sortOrder?: number;
}

export class UpdateServiceDto {
  @ApiPropertyOptional({ example: 'category-uuid' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'Fan Repair', maxLength: 140 })
  @IsOptional()
  @IsString()
  @MaxLength(140)
  name?: string;

  @ApiPropertyOptional({ example: 'fan-repair', maxLength: 160 })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  slug?: string;

  @ApiPropertyOptional({ example: 'Ceiling fan inspection, repair, and replacement support.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ example: 499 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99999999)
  basePrice?: number;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1440)
  estimatedDurationMins?: number;

  @ApiPropertyOptional({ example: 'https://cdn.fixhub.in/icons/fan-repair.png' })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(1000)
  iconUrl?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10000)
  sortOrder?: number;
}
