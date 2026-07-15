import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ServiceAreaQueryDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'Kolathur' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @ApiPropertyOptional({ example: 'Tamil Nadu' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  state?: string;

  @ApiPropertyOptional({ example: '600099' })
  @IsOptional()
  @Matches(/^\d{6}$/)
  pincode?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
