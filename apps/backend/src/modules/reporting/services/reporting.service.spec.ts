import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';

import { ReportingQueryDto } from '../dto/reporting-query.dto';
import { ReportingRepository } from '../repositories/reporting.repository';
import { ExportService } from './export.service';
import { ReportingCacheService } from './reporting-cache.service';
import { ReportingService } from './reporting.service';

describe('ReportingService', () => {
  let service: ReportingService;
  let repository: jest.Mocked<ReportingRepository>;
  let cache: jest.Mocked<ReportingCacheService>;
  let exportService: jest.Mocked<ExportService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportingService,
        {
          provide: ReportingRepository,
          useValue: {
            getRevenueMetrics: jest.fn(),
            getBookingMetrics: jest.fn(),
            getCustomerMetrics: jest.fn(),
            getTechnicianMetrics: jest.fn(),
            getPaymentMetrics: jest.fn(),
            getCancellationMetrics: jest.fn(),
            getGrowthMetrics: jest.fn(),
          },
        },
        {
          provide: ReportingCacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            generateKey: jest.fn().mockReturnValue('test-key'),
          },
        },
        {
          provide: ExportService,
          useValue: {
            generateCsv: jest.fn(),
            generateExcel: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ReportingService>(ReportingService);
    repository = module.get(ReportingRepository);
    cache = module.get(ReportingCacheService);
    exportService = module.get(ExportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRevenueReport', () => {
    it('should return data as json if no export format provided', async () => {
      const mockRes = { json: jest.fn() } as unknown as Response;
      cache.get.mockResolvedValue(null);
      repository.getRevenueMetrics.mockResolvedValue(15000 as any);

      await service.getRevenueReport(new ReportingQueryDto(), mockRes);

      expect(repository.getRevenueMetrics).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ totalRevenue: 15000 }));
    });

    it('should call export service if csv requested', async () => {
      const mockRes = {} as unknown as Response;
      const query = new ReportingQueryDto();
      query.export = 'csv' as any;

      cache.get.mockResolvedValue({ totalRevenue: 15000 });

      await service.getRevenueReport(query, mockRes);

      expect(exportService.generateCsv).toHaveBeenCalled();
    });
  });
});
