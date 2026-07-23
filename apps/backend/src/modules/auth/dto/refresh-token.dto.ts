import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Opaque refresh token received during login or previous refresh',
    example: 'a1b2c3d4e5f6...',
  })
  @IsString()
  @IsOptional()
  refreshToken?: string;
}
