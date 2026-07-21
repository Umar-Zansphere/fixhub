import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDecimal, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

// ── Price revision DTOs ───────────────────────────────────────

export class ProposeRevisionDto {
  @ApiProperty({ example: 1500.00, description: 'Proposed revised amount in INR' })
  @Type(() => Number)
  @IsDecimal({ decimal_digits: '0,2' })
  revisedAmount!: number;

  @ApiPropertyOptional({ example: 'Additional parts required for the repair' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
