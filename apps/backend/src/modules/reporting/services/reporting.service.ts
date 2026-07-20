import { Injectable, StreamableFile } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

import { ExportFormat, ReportingQueryDto } from '../dto/reporting-query.dto';
import { ReportingRepository } from '../repositories/reporting.repository';
import { ExportService } from './export.service';
import { ReportingCacheService } from './reporting-cache.service';

@Injectable()
export class ReportingService {
  constructor(
    private readonly repository: ReportingRepository,
    private readonly cache: ReportingCacheService,
    private readonly exportService: ExportService,
  ) {}

  async getRevenueReport(query: ReportingQueryDto, res: Response) {
    const data = await this.getReportData('revenue', query, async (where) => {
      const revenue = await this.repository.getRevenueMetrics(where);
      return { totalRevenue: revenue };
    });

    return this.handleExport(data, 'revenue-report', query, res);
  }

  async getBookingReport(query: ReportingQueryDto, res: Response) {
    const data = await this.getReportData('bookings', query, async (where) => {
      return this.repository.getBookingMetrics(where);
    });

    return this.handleExport(data, 'booking-report', query, res);
  }

  async getCustomerReport(query: ReportingQueryDto, res: Response) {
    const data = await this.getReportData('customers', query, async (where) => {
      return this.repository.getCustomerMetrics(where, where);
    });

    return this.handleExport(data, 'customer-report', query, res);
  }

  async getTechnicianReport(query: ReportingQueryDto, res: Response) {
    const data = await this.getReportData('technicians', query, async (where) => {
      return this.repository.getTechnicianMetrics(where);
    });

    return this.handleExport(data, 'technician-report', query, res);
  }

  async getPaymentReport(query: ReportingQueryDto, res: Response) {
    const data = await this.getReportData('payments', query, async (where) => {
      return this.repository.getPaymentMetrics(where);
    });

    return this.handleExport(data, 'payment-report', query, res);
  }

  async getCancellationReport(query: ReportingQueryDto, res: Response) {
    const data = await this.getReportData('cancellations', query, async (where) => {
      return this.repository.getCancellationMetrics(where);
    });

    return this.handleExport(data, 'cancellation-report', query, res);
  }

  async getGrowthReport(query: ReportingQueryDto, res: Response) {
    const start = query.startDate ?? new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    const end = query.endDate ?? new Date();
    
    const key = this.cache.generateKey('growth', start, end);
    let data = await this.cache.get<any>(key);
    
    if (!data) {
      data = await this.repository.getGrowthMetrics(start, end);
      await this.cache.set(key, data);
    }

    return this.handleExport(data, 'growth-report', query, res);
  }

  private async getReportData(
    reportType: string,
    query: ReportingQueryDto,
    fetchFn: (where: any) => Promise<any>,
  ) {
    const key = this.cache.generateKey(reportType, query.startDate, query.endDate);
    let data = await this.cache.get<any>(key);

    if (!data) {
      const where = this.getDateRangeWhere(query.startDate, query.endDate);
      const metrics = await fetchFn(where);
      data = {
        period: { startDate: query.startDate, endDate: query.endDate },
        ...metrics,
      };
      await this.cache.set(key, data);
    }

    return data;
  }

  private async handleExport(
    data: any,
    filename: string,
    query: ReportingQueryDto,
    res: Response,
  ): Promise<any | StreamableFile> {
    if (!query.export) {
      return res.json(data);
    }

    // Flatten data for export
    const exportData = Array.isArray(data) ? data : this.flattenData(data);

    if (query.export === ExportFormat.CSV) {
      return this.exportService.generateCsv(exportData, filename, res);
    } else if (query.export === ExportFormat.EXCEL) {
      return this.exportService.generateExcel(exportData, filename, res);
    }
    
    return res.json(data);
  }

  private flattenData(data: any): Record<string, any>[] {
    // Basic flattening logic for arrays or object properties
    if (data.period) {
      delete data.period; // usually not needed for tabular export or can be added to rows
    }
    
    // If it contains a list of items like topPerformers, return that list
    for (const key of Object.keys(data)) {
      if (Array.isArray(data[key])) {
        return data[key].map((item: any) => {
          if (typeof item === 'object') {
            return { ...item };
          }
          return { [key]: item };
        });
      }
    }

    // Otherwise return as single row
    const row: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value !== 'object') {
        row[key] = value;
      } else {
        row[key] = JSON.stringify(value);
      }
    }
    return [row];
  }

  private getDateRangeWhere(startDate?: Date, endDate?: Date): any {
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }
    return where;
  }
}
