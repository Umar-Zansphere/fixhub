import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsIn, IsNotEmpty, IsPhoneNumber, IsString, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({
    example: '+919876543210',
    description: 'Phone number used to request OTP',
  })
  @IsString()
  @IsNotEmpty()
  @IsPhoneNumber('IN', { message: 'Phone number must be a valid Indian number' })
  phone: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit numeric OTP',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'OTP must contain only digits' })
  otp: string;

  @ApiProperty({
    enum: [Role.CUSTOMER, Role.TECHNICIAN],
    example: Role.CUSTOMER,
    description: 'Role the user is logging in as (CUSTOMER or TECHNICIAN)',
  })
  @IsIn([Role.CUSTOMER, Role.TECHNICIAN], { message: 'Role must be CUSTOMER or TECHNICIAN' })
  role: Role;
}
