import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional } from 'class-validator';

export enum ExportFormat {
  CSV = 'csv',
  EXCEL = 'excel',
}

export class ReportingQueryDto {
  @ApiPropertyOptional({ description: 'Start date for the report period (ISO 8601)' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date for the report period (ISO 8601)' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional({ enum: ExportFormat, description: 'Export format for the report' })
  @IsOptional()
  @IsEnum(ExportFormat)
  export?: ExportFormat;

  @ApiPropertyOptional({ description: 'Group by period (day, week, month)' })
  @IsOptional()
  groupBy?: string;
}
