import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Response } from 'express';

import { Roles } from '../../../common/decorators/roles.decorator';
import { ReportingQueryDto } from '../dto/reporting-query.dto';
import { ReportingService } from '../services/reporting.service';

@ApiTags('Reporting')
@ApiBearerAuth()
@Controller('reports')
@Roles(Role.ADMIN)
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue report' })
  async getRevenueReport(@Query() query: ReportingQueryDto, @Res() res: Response) {
    return this.reportingService.getRevenueReport(query, res);
  }

  @Get('bookings')
  @ApiOperation({ summary: 'Get bookings report' })
  async getBookingReport(@Query() query: ReportingQueryDto, @Res() res: Response) {
    return this.reportingService.getBookingReport(query, res);
  }

  @Get('customers')
  @ApiOperation({ summary: 'Get customers report' })
  async getCustomerReport(@Query() query: ReportingQueryDto, @Res() res: Response) {
    return this.reportingService.getCustomerReport(query, res);
  }

  @Get('technicians')
  @ApiOperation({ summary: 'Get technicians report' })
  async getTechnicianReport(@Query() query: ReportingQueryDto, @Res() res: Response) {
    return this.reportingService.getTechnicianReport(query, res);
  }

  @Get('payments')
  @ApiOperation({ summary: 'Get payments report' })
  async getPaymentReport(@Query() query: ReportingQueryDto, @Res() res: Response) {
    return this.reportingService.getPaymentReport(query, res);
  }

  @Get('cancellations')
  @ApiOperation({ summary: 'Get cancellations report' })
  async getCancellationReport(@Query() query: ReportingQueryDto, @Res() res: Response) {
    return this.reportingService.getCancellationReport(query, res);
  }

  @Get('growth')
  @ApiOperation({ summary: 'Get growth report' })
  async getGrowthReport(@Query() query: ReportingQueryDto, @Res() res: Response) {
    return this.reportingService.getGrowthReport(query, res);
  }
}
