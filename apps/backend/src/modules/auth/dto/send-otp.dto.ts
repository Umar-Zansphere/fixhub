import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsPhoneNumber, IsString, Matches } from 'class-validator';

export class SendOtpDto {
  @ApiProperty({
    example: '+919876543210',
    description: 'Phone number with country code (Indian numbers only)',
  })
  @IsString()
  @IsNotEmpty()
  @IsPhoneNumber('IN', { message: 'Phone number must be a valid Indian number with country code (+91)' })
  phone: string;
}
