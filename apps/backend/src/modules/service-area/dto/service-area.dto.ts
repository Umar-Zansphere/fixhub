import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateServiceAreaDto {
  @ApiProperty({ example: 'Kolathur', maxLength: 120 })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: '600099' })
  @Matches(/^\d{6}$/)
  pincode!: string;

  @ApiProperty({ example: 'Chennai', maxLength: 120 })
  @IsString()
  @MaxLength(120)
  city!: string;

  @ApiProperty({ example: 'Tamil Nadu', maxLength: 120 })
  @IsString()
  @MaxLength(120)
  state!: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateServiceAreaDto {
  @ApiPropertyOptional({ example: 'Kolathur', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: '600099' })
  @IsOptional()
  @Matches(/^\d{6}$/)
  pincode?: string;

  @ApiPropertyOptional({ example: 'Chennai', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @ApiPropertyOptional({ example: 'Tamil Nadu', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  state?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
