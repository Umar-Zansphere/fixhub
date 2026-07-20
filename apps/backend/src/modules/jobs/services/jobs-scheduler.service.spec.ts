import { Test, TestingModule } from '@nestjs/testing';
import { Queue } from 'bullmq';

import { QUEUE_NAMES } from '../../../common/queue/queue.constants';
import { JobsSchedulerService } from './jobs-scheduler.service';

describe('JobsSchedulerService', () => {
  let service: JobsSchedulerService;
  let queue: jest.Mocked<Queue>;

  beforeEach(async () => {
    queue = {
      getRepeatableJobs: jest.fn().mockResolvedValue([]),
      removeRepeatableByKey: jest.fn(),
      add: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsSchedulerService,
        {
          provide: `BullQueue_${QUEUE_NAMES.SCHEDULED_JOBS}`,
          useValue: queue,
        },
      ],
    }).compile();

    service = module.get<JobsSchedulerService>(JobsSchedulerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should remove existing repeatable jobs and add new ones on bootstrap', async () => {
    queue.getRepeatableJobs.mockResolvedValue([{ key: 'old-job-key' }] as any);

    await service.onApplicationBootstrap();

    expect(queue.removeRepeatableByKey).toHaveBeenCalledWith('old-job-key');
    expect(queue.add).toHaveBeenCalledTimes(6);
    expect(queue.add).toHaveBeenCalledWith('generate-daily-reports', {}, expect.any(Object));
    expect(queue.add).toHaveBeenCalledWith('booking-expiry', {}, expect.any(Object));
  });
});
