import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

export class ValidateServiceAreaDto {
  @ApiProperty({ example: '600099' })
  @Matches(/^\d{6}$/)
  pincode!: string;
}
