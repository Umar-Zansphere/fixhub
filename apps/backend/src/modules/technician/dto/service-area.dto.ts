import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class UpdateServiceAreasDto {
  @ApiProperty({ type: [String], example: ['service-area-uuid-1', 'service-area-uuid-2'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  serviceAreaIds!: string[];
}
