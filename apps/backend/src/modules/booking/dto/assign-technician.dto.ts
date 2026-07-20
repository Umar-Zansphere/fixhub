import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AssignTechnicianDto {
  @ApiProperty({ example: 'technician-uuid' })
  @IsString()
  technicianId!: string;
}
