import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateNotesDto {
  @ApiProperty({ description: 'Internal notes for the booking' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}
