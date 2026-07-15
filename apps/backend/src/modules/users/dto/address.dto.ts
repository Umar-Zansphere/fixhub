import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateAddressDto {
  @ApiPropertyOptional({ example: 'Home', default: 'Home', maxLength: 40 })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  label?: string;

  @ApiProperty({ example: 'No. 12, First Main Road' })
  @IsString()
  @MaxLength(180)
  line1!: string;

  @ApiPropertyOptional({ example: 'Apartment 3B' })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  line2?: string;

  @ApiPropertyOptional({ example: 'Near metro station' })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  landmark?: string;

  @ApiProperty({ example: 'Chennai' })
  @IsString()
  @MaxLength(80)
  city!: string;

  @ApiProperty({ example: 'Tamil Nadu' })
  @IsString()
  @MaxLength(80)
  state!: string;

  @ApiProperty({ example: '600001', minLength: 6, maxLength: 6 })
  @IsString()
  @Length(6, 6)
  pincode!: string;

  @ApiProperty({ example: 13.0826802 })
  @Type(() => Number)
  @IsLatitude()
  latitude!: number;

  @ApiProperty({ example: 80.2707184 })
  @Type(() => Number)
  @IsLongitude()
  longitude!: number;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateAddressDto {
  @ApiPropertyOptional({ example: 'Work', maxLength: 40 })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  label?: string;

  @ApiPropertyOptional({ example: 'No. 12, First Main Road' })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  line1?: string;

  @ApiPropertyOptional({ example: 'Apartment 3B' })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  line2?: string;

  @ApiPropertyOptional({ example: 'Near metro station' })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  landmark?: string;

  @ApiPropertyOptional({ example: 'Chennai' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @ApiPropertyOptional({ example: 'Tamil Nadu' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  state?: string;

  @ApiPropertyOptional({ example: '600001', minLength: 6, maxLength: 6 })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  pincode?: string;

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
