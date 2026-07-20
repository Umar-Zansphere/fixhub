import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BookingStatus, Role } from '@prisma/client';

import { BookingLifecycleService } from '../../booking/services/booking-lifecycle.service';
import { TechnicianJobRepository } from '../repositories/technician-job.repository';
import { TechnicianService } from './technician.service';
import { TechnicianJobService } from './technician-job.service';

describe('TechnicianJobService', () => {
  let service: TechnicianJobService;
  let technicianService: jest.Mocked<TechnicianService>;
  let jobRepository: jest.Mocked<TechnicianJobRepository>;
  let lifecycleService: jest.Mocked<BookingLifecycleService>;

  const user = {
    userId: 'user-uuid-1',
    phone: '+919876543210',
    role: Role.TECHNICIAN as string,
  };
  const technicianId = 'tech-uuid-1';
  const bookingId = 'booking-uuid-1';

  const assignedJob = {
    id: bookingId,
    technicianId,
    status: BookingStatus.ASSIGNED,
    customer: { userId: 'customer-user-uuid' },
    technician: { id: technicianId, userId: user.userId },
    subService: { name: 'Fan Repair', category: { name: 'Electrical' } },
    address: { city: 'Chennai' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TechnicianJobService,
        {
          provide: TechnicianService,
          useValue: {
            resolveTechnicianId: jest.fn(),
          },
        },
        {
          provide: TechnicianJobRepository,
          useValue: {
            listJobs: jest.fn(),
            listJobHistory: jest.fn(),
            findCurrentJob: jest.fn(),
            findJobById: jest.fn(),
            findJobForAction: jest.fn(),
          },
        },
        {
          provide: BookingLifecycleService,
          useValue: {
            transition: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(TechnicianJobService);
    technicianService = module.get(TechnicianService);
    jobRepository = module.get(TechnicianJobRepository);
    lifecycleService = module.get(BookingLifecycleService);

    technicianService.resolveTechnicianId.mockResolvedValue(technicianId);
  });

  describe('acceptJob', () => {
    it('accepts an assigned job and transitions to ACCEPTED', async () => {
      jobRepository.findJobForAction.mockResolvedValue(assignedJob as any);
      lifecycleService.transition.mockResolvedValue({
        booking: { ...assignedJob, status: BookingStatus.ACCEPTED },
        transition: { from: BookingStatus.ASSIGNED, to: BookingStatus.ACCEPTED, allowedNextStatuses: [] },
      } as any);

      const result = await service.acceptJob(user, bookingId);

      expect(lifecycleService.transition).toHaveBeenCalledWith(
        bookingId,
        user,
        expect.objectContaining({ status: BookingStatus.ACCEPTED }),
      );
      expect(result.booking.status).toBe(BookingStatus.ACCEPTED);
    });

    it('rejects accepting a non-ASSIGNED job', async () => {
      jobRepository.findJobForAction.mockResolvedValue({
        ...assignedJob,
        status: BookingStatus.ACCEPTED,
      } as any);

      await expect(service.acceptJob(user, bookingId)).rejects.toThrow(BadRequestException);
    });

    it('throws when job is not assigned to the technician', async () => {
      jobRepository.findJobForAction.mockResolvedValue(null);

      await expect(service.acceptJob(user, bookingId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('rejectJob', () => {
    it('rejects a job and transitions back to CONFIRMED', async () => {
      jobRepository.findJobForAction.mockResolvedValue(assignedJob as any);
      lifecycleService.transition.mockResolvedValue({
        booking: { ...assignedJob, status: BookingStatus.CONFIRMED },
        transition: { from: BookingStatus.ASSIGNED, to: BookingStatus.CONFIRMED, allowedNextStatuses: [] },
      } as any);

      const result = await service.rejectJob(user, bookingId, { reason: 'Too far away' });

      expect(lifecycleService.transition).toHaveBeenCalledWith(
        bookingId,
        expect.objectContaining({ role: 'ADMIN' }),
        expect.objectContaining({
          status: BookingStatus.CONFIRMED,
          note: expect.stringContaining('Too far away'),
        }),
      );
      expect(result.booking.status).toBe(BookingStatus.CONFIRMED);
    });

    it('rejects when job is not in ASSIGNED status', async () => {
      jobRepository.findJobForAction.mockResolvedValue({
        ...assignedJob,
        status: BookingStatus.IN_PROGRESS,
      } as any);

      await expect(
        service.rejectJob(user, bookingId, { reason: 'Too far' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateJobStatus', () => {
    it('transitions job to EN_ROUTE', async () => {
      jobRepository.findJobForAction.mockResolvedValue({
        ...assignedJob,
        status: BookingStatus.ACCEPTED,
      } as any);
      lifecycleService.transition.mockResolvedValue({
        booking: { ...assignedJob, status: BookingStatus.EN_ROUTE },
        transition: { from: BookingStatus.ACCEPTED, to: BookingStatus.EN_ROUTE, allowedNextStatuses: [] },
      } as any);

      const result = await service.updateJobStatus(user, bookingId, {
        status: BookingStatus.EN_ROUTE,
        note: 'On my way',
        latitude: 13.08,
        longitude: 80.27,
      });

      expect(result.booking.status).toBe(BookingStatus.EN_ROUTE);
    });

    it('rejects technician-disallowed status transitions', async () => {
      jobRepository.findJobForAction.mockResolvedValue(assignedJob as any);

      await expect(
        service.updateJobStatus(user, bookingId, {
          status: BookingStatus.CANCELLED,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('listJobs', () => {
    it('returns paginated jobs', async () => {
      const paginated = {
        items: [assignedJob],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
      };
      jobRepository.listJobs.mockResolvedValue(paginated as any);

      const result = await service.listJobs(user.userId, { page: 1, limit: 10 } as any);

      expect(result.items).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('getCurrentJob', () => {
    it('returns the current active job', async () => {
      jobRepository.findCurrentJob.mockResolvedValue({
        ...assignedJob,
        status: BookingStatus.IN_PROGRESS,
      } as any);

      const result = await service.getCurrentJob(user.userId);

      expect(result).toBeDefined();
      expect(result!.status).toBe(BookingStatus.IN_PROGRESS);
    });

    it('returns null when no active job', async () => {
      jobRepository.findCurrentJob.mockResolvedValue(null);

      const result = await service.getCurrentJob(user.userId);

      expect(result).toBeNull();
    });
  });
});
