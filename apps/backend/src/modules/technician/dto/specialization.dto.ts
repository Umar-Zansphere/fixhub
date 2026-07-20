import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class AddSpecializationsDto {
  @ApiProperty({ type: [String], example: ['sub-service-uuid-1', 'sub-service-uuid-2'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  subServiceIds!: string[];
}

export class RemoveSpecializationsDto {
  @ApiProperty({ type: [String], example: ['sub-service-uuid-1'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  subServiceIds!: string[];
}
