import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsLatitude, IsLongitude, IsOptional } from 'class-validator';

export class UpdateAvailabilityDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isAvailable!: boolean;

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
