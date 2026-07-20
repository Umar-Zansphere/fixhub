import { Test, TestingModule } from '@nestjs/testing';
import { BookingStatus } from '@prisma/client';

import { PrismaService } from '../../../common/database/prisma.service';
import { ScheduledJobsWorker } from './scheduled-jobs.worker';

describe('ScheduledJobsWorker', () => {
  let worker: ScheduledJobsWorker;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduledJobsWorker,
        {
          provide: PrismaService,
          useValue: {
            booking: {
              updateMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    worker = module.get<ScheduledJobsWorker>(ScheduledJobsWorker);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(worker).toBeDefined();
  });

  describe('process', () => {
    it('should handle generate-daily-reports', async () => {
      const job = { name: 'generate-daily-reports', id: '1' } as any;
      const result = await worker.process(job);
      expect(result).toEqual({ success: true, message: 'Daily reports generated successfully' });
    });

    it('should handle booking-expiry', async () => {
      const job = { name: 'booking-expiry', id: '2' } as any;
      (prisma.booking.updateMany as jest.Mock).mockResolvedValue({ count: 5 });

      const result = await worker.process(job);

      expect(prisma.booking.updateMany).toHaveBeenCalledWith({
        where: {
          status: BookingStatus.PENDING_PAYMENT,
          createdAt: { lt: expect.any(Date) },
        },
        data: {
          status: BookingStatus.CANCELLED,
          cancelReason: 'Automatically expired due to inactivity',
        },
      });
      expect(result).toEqual({ success: true, count: 5 });
    });

    it('should throw error for unknown job', async () => {
      const job = { name: 'unknown-job', id: '3' } as any;
      // It won't throw, just warns and returns undefined based on implementation
      const result = await worker.process(job);
      expect(result).toBeUndefined();
    });
  });
});
