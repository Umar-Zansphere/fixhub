import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BookingStatus, Role } from '@prisma/client';

import { BookingStateMachineService } from '../lifecycle/booking-state-machine.service';
import { BookingRepository } from '../repositories/booking.repository';
import { BookingLifecycleService } from './booking-lifecycle.service';
import { BookingQueryCacheService } from './booking-query-cache.service';

describe('BookingLifecycleService', () => {
  let service: BookingLifecycleService;
  let repository: jest.Mocked<BookingRepository>;
  let queryCacheService: jest.Mocked<BookingQueryCacheService>;

  const booking = {
    id: 'booking-uuid-1',
    status: BookingStatus.ASSIGNED,
    customerId: 'customer-uuid-1',
    technicianId: 'technician-uuid-1',
    cancelledAt: null,
    completedAt: null,
    failedAt: null,
    customer: { userId: 'customer-user-uuid-1' },
    technician: { userId: 'technician-user-uuid-1' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingLifecycleService,
        BookingStateMachineService,
        {
          provide: BookingRepository,
          useValue: {
            findByIdForLifecycle: jest.fn(),
            updateLifecycleStatus: jest.fn(),
            createTimelineEntry: jest.fn(),
            createAuditLog: jest.fn(),
            transaction: jest.fn((fn) => fn({})),
          },
        },
        {
          provide: BookingQueryCacheService,
          useValue: {
            invalidate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(BookingLifecycleService);
    repository = module.get(BookingRepository);
    queryCacheService = module.get(BookingQueryCacheService);
  });

  it('updates status, writes timeline, and writes audit log in one transaction', async () => {
    repository.findByIdForLifecycle.mockResolvedValue(booking as any);
    repository.updateLifecycleStatus.mockResolvedValue({
      ...booking,
      status: BookingStatus.ACCEPTED,
    } as any);

    const result = await service.transition(
      booking.id,
      {
        userId: 'technician-user-uuid-1',
        phone: '+919876543210',
        role: Role.TECHNICIAN,
      },
      { status: BookingStatus.ACCEPTED, note: 'Accepted' },
    );

    expect(result.transition).toEqual(
      expect.objectContaining({
        from: BookingStatus.ASSIGNED,
        to: BookingStatus.ACCEPTED,
      }),
    );
    expect(repository.transaction).toHaveBeenCalled();
    expect(repository.updateLifecycleStatus).toHaveBeenCalledWith(
      {},
      booking.id,
      expect.objectContaining({ status: BookingStatus.ACCEPTED }),
      'technician-user-uuid-1',
    );
    expect(repository.createTimelineEntry).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        bookingId: booking.id,
        status: BookingStatus.ACCEPTED,
        changedByUserId: 'technician-user-uuid-1',
        note: 'Accepted',
      }),
    );
    expect(repository.createAuditLog).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        userId: 'technician-user-uuid-1',
        entityId: booking.id,
      }),
    );
    expect(queryCacheService.invalidate).toHaveBeenCalled();
  });

  it('throws when booking is missing', async () => {
    repository.findByIdForLifecycle.mockResolvedValue(null);

    await expect(
      service.transition(
        'missing',
        { userId: 'admin-uuid-1', phone: '+919876543210', role: Role.ADMIN },
        { status: BookingStatus.CANCELLED, cancelReason: 'Duplicate booking' },
      ),
    ).rejects.toThrow(NotFoundException);
  });
});
