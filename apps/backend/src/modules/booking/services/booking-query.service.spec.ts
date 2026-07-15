import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BookingStatus, Role } from '@prisma/client';

import { BookingRepository } from '../repositories/booking.repository';
import { BookingQueryCacheService } from './booking-query-cache.service';
import { BookingQueryService } from './booking-query.service';

describe('BookingQueryService', () => {
  let service: BookingQueryService;
  let repository: jest.Mocked<BookingRepository>;
  let cacheService: jest.Mocked<BookingQueryCacheService>;

  const customerActor = {
    userId: 'customer-user-uuid-1',
    phone: '+919876543210',
    role: Role.CUSTOMER,
  };
  const technicianActor = {
    userId: 'technician-user-uuid-1',
    phone: '+919876543211',
    role: Role.TECHNICIAN,
  };
  const booking = {
    id: 'booking-uuid-1',
    status: BookingStatus.CONFIRMED,
    customer: { userId: customerActor.userId },
    technician: { userId: technicianActor.userId },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingQueryService,
        {
          provide: BookingRepository,
          useValue: {
            listBookings: jest.fn(),
            listBookingHistory: jest.fn(),
            findBookingDetails: jest.fn(),
          },
        },
        {
          provide: BookingQueryCacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(BookingQueryService);
    repository = module.get(BookingRepository);
    cacheService = module.get(BookingQueryCacheService);
  });

  it('scopes customer booking lists to the current customer user', async () => {
    const result = { items: [booking], meta: { total: 1 } };
    cacheService.get.mockResolvedValue(null);
    repository.listBookings.mockResolvedValue(result as any);

    await expect(service.listForActor(customerActor, {} as any)).resolves.toBe(result);

    expect(repository.listBookings).toHaveBeenCalledWith(
      {},
      { customerUserId: customerActor.userId },
    );
    expect(cacheService.set).toHaveBeenCalled();
  });

  it('scopes technician booking lists to the current technician user', async () => {
    cacheService.get.mockResolvedValue(null);
    repository.listBookings.mockResolvedValue({ items: [], meta: { total: 0 } } as any);

    await service.listForActor(technicianActor, { status: BookingStatus.ASSIGNED } as any);

    expect(repository.listBookings).toHaveBeenCalledWith(
      { status: BookingStatus.ASSIGNED },
      { technicianUserId: technicianActor.userId },
    );
  });

  it('returns cached list results without hitting Prisma', async () => {
    const cached = { items: [booking], meta: { total: 1 } };
    cacheService.get.mockResolvedValue(cached);

    const result = await service.listForActor(customerActor, {} as any);

    expect(result).toBe(cached);
    expect(repository.listBookings).not.toHaveBeenCalled();
  });

  it('uses admin list query without actor scope', async () => {
    cacheService.get.mockResolvedValue(null);
    repository.listBookings.mockResolvedValue({ items: [], meta: { total: 0 } } as any);

    await service.listAdmin({ search: 'FH-' } as any);

    expect(repository.listBookings).toHaveBeenCalledWith({ search: 'FH-' });
  });

  it('lists history through the history repository query', async () => {
    cacheService.get.mockResolvedValue(null);
    repository.listBookingHistory.mockResolvedValue({ items: [], meta: { total: 0 } } as any);

    await service.listHistoryForActor(customerActor, {} as any);

    expect(repository.listBookingHistory).toHaveBeenCalledWith(
      {},
      { customerUserId: customerActor.userId },
    );
  });

  it('returns details when actor owns the booking', async () => {
    cacheService.get.mockResolvedValue(null);
    repository.findBookingDetails.mockResolvedValue(booking as any);

    await expect(service.getDetailsForActor(customerActor, booking.id)).resolves.toBe(booking);
  });

  it('rejects details when actor does not own the booking', async () => {
    cacheService.get.mockResolvedValue(null);
    repository.findBookingDetails.mockResolvedValue(booking as any);

    await expect(
      service.getDetailsForActor(
        { ...customerActor, userId: 'other-customer-user-uuid' },
        booking.id,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws when details are missing', async () => {
    cacheService.get.mockResolvedValue(null);
    repository.findBookingDetails.mockResolvedValue(null);

    await expect(service.getDetailsForActor(customerActor, 'missing')).rejects.toThrow(
      NotFoundException,
    );
  });
});
