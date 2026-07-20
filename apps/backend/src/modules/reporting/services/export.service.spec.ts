import { StreamableFile } from '@nestjs/common';
import { Response } from 'express';

import { ExportService } from './export.service';

describe('ExportService', () => {
  let service: ExportService;

  beforeEach(() => {
    service = new ExportService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateCsv', () => {
    it('should generate a CSV streamable file', () => {
      const data = [{ name: 'Test', count: 10 }];
      const mockRes = { set: jest.fn() } as unknown as Response;

      const result = service.generateCsv(data, 'test', mockRes);

      expect(mockRes.set).toHaveBeenCalledWith(
        expect.objectContaining({ 'Content-Type': 'text/csv' }),
      );
      expect(result).toBeInstanceOf(StreamableFile);
    });
  });

  describe('generateExcel', () => {
    it('should generate an Excel streamable file', async () => {
      const data = [{ name: 'Test', count: 10 }];
      const mockRes = { set: jest.fn() } as unknown as Response;

      const result = await service.generateExcel(data, 'test', mockRes);

      expect(mockRes.set).toHaveBeenCalledWith(
        expect.objectContaining({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      );
      expect(result).toBeInstanceOf(StreamableFile);
    });
  });
});
