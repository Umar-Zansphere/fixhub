import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class UpdateTechnicianProfileDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

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

export class UpdateUserProfileDto {
  @ApiPropertyOptional({ example: 'Ravi Kumar', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'ravi@example.com', maxLength: 255 })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ type: UpdateTechnicianProfileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateTechnicianProfileDto)
  technician?: UpdateTechnicianProfileDto;
}
