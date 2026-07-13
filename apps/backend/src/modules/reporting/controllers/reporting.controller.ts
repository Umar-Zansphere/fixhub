import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation,ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { Roles } from '../../../common/decorators/roles.decorator';
import { ReportingService } from '../services/reporting.service';

@ApiTags('Reporting')
@ApiBearerAuth()
@Controller('reports')
@Roles(Role.ADMIN)
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('bookings/summary')
  @ApiOperation({ summary: 'Get booking summary report' })
  async getBookingSummary(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportingService.getBookingSummary(startDate, endDate);
  }

  // TODO: Add endpoints for:
  // GET /revenue — Revenue report
  // GET /technicians/performance — Technician performance
  // GET /categories/popularity — Category popularity
}
