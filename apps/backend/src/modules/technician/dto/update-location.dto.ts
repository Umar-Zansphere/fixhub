import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsLatitude, IsLongitude } from 'class-validator';

export class UpdateLocationDto {
  @ApiProperty({ example: 13.0826802 })
  @Type(() => Number)
  @IsLatitude()
  latitude!: number;

  @ApiProperty({ example: 80.2707184 })
  @Type(() => Number)
  @IsLongitude()
  longitude!: number;
}
