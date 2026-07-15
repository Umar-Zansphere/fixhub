import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class ProfileImageDto {
  @ApiProperty({ example: 'avatar.jpg', maxLength: 180 })
  @IsString()
  @MaxLength(180)
  fileName!: string;

  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  @MaxLength(80)
  contentType!: string;

  @ApiPropertyOptional({
    description: 'Public URL or CDN URL to persist after upload completion',
    example: 'https://cdn.fixhub.in/profile-images/user-id/avatar.jpg',
  })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(1000)
  imageUrl?: string;
}
