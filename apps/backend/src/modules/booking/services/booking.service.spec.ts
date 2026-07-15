import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BookingStatus, Role } from '@prisma/client';

import { StorageService } from '../../../common/storage/storage.service';
import { BookingRepository } from '../repositories/booking.repository';
import { BookingLockService } from './booking-lock.service';
import { BookingQueryCacheService } from './booking-query-cache.service';
import { BookingService } from './booking.service';

describe('BookingService creation', () => {
  let service: BookingService;
  let repository: jest.Mocked<BookingRepository>;
  let lockService: jest.Mocked<BookingLockService>;
  let storageService: jest.Mocked<StorageService>;
  let queryCacheService: jest.Mocked<BookingQueryCacheService>;

  const user = {
    userId: 'user-uuid-1',
    phone: '+919876543210',
    role: Role.CUSTOMER,
  };
  const customer = {
    id: 'customer-uuid-1',
    userId: user.userId,
    user: { id: user.userId, isActive: true, deletedAt: null },
  };
  const address = {
    id: 'address-uuid-1',
    customerId: customer.id,
    label: 'Home',
    line1: 'Street',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600099',
  };
  const serviceItem = {
    id: 'service-uuid-1',
    name: 'Fan Repair',
    basePrice: 499,
    estimatedDurationMins: 60,
    category: { id: 'category-uuid-1', name: 'Electrical' },
  };
  const serviceArea = {
    id: 'service-area-uuid-1',
    name: 'Kolathur',
    pincode: '600099',
  };
  const dto = {
    subServiceId: serviceItem.id,
    addressId: address.id,
    scheduledDate: '2099-07-20',
    scheduledSlot: '10:00-12:00',
    description: 'Fan is noisy',
  };
  const booking = {
    id: 'booking-uuid-1',
    bookingNumber: 'FH-20990720-0001',
    customerId: customer.id,
    addressId: address.id,
    subServiceId: serviceItem.id,
    scheduledDate: new Date('2099-07-20T00:00:00.000Z'),
    scheduledSlot: dto.scheduledSlot,
    status: BookingStatus.DRAFT,
    address,
    subService: serviceItem,
    media: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        {
          provide: BookingRepository,
          useValue: {
            findByUser: jest.fn(),
            findById: jest.fn(),
            findCustomerByUserId: jest.fn(),
            findAddressForCustomer: jest.fn(),
            findActiveService: jest.fn(),
            findActiveServiceAreaByPincode: jest.fn(),
            countSlotConflicts: jest.fn(),
            createBooking: jest.fn(),
            updateBookingStatus: jest.fn(),
            updateDraftAndConfirm: jest.fn(),
            findDraftForCustomer: jest.fn(),
            createMedia: jest.fn(),
            transaction: jest.fn((fn) => fn({})),
          },
        },
        {
          provide: BookingLockService,
          useValue: {
            acquire: jest.fn(),
            release: jest.fn(),
            nextBookingNumber: jest.fn(),
            setDraftExpiry: jest.fn(),
            isDraftActive: jest.fn(),
            clearDraftExpiry: jest.fn(),
          },
        },
        {
          provide: StorageService,
          useValue: {
            generateKey: jest.fn(),
            getUploadUrl: jest.fn(),
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

    service = module.get(BookingService);
    repository = module.get(BookingRepository);
    lockService = module.get(BookingLockService);
    storageService = module.get(StorageService);
    queryCacheService = module.get(BookingQueryCacheService);

    repository.findCustomerByUserId.mockResolvedValue(customer as any);
    repository.findAddressForCustomer.mockResolvedValue(address as any);
    repository.findActiveServiceAreaByPincode.mockResolvedValue(serviceArea as any);
    repository.findActiveService.mockResolvedValue(serviceItem as any);
    repository.countSlotConflicts.mockResolvedValue(0);
    lockService.acquire.mockResolvedValue('lock-token');
    lockService.nextBookingNumber.mockResolvedValue('FH-20990720-0001');
    repository.createBooking.mockResolvedValue(booking as any);
  });

  it('returns a booking summary after validating customer, address, area, service, and slot', async () => {
    const result = await service.getSummary(user, dto);

    expect(result.service.id).toBe(serviceItem.id);
    expect(result.address.id).toBe(address.id);
    expect(result.serviceArea.id).toBe(serviceArea.id);
    expect(result.pricing.total).toBe(499);
  });

  it('rejects non-customer booking creation', async () => {
    await expect(
      service.getSummary({ ...user, role: Role.TECHNICIAN }, dto),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws when customer address is missing', async () => {
    repository.findAddressForCustomer.mockResolvedValue(null);

    await expect(service.getSummary(user, dto)).rejects.toThrow(NotFoundException);
  });

  it('creates a draft booking with a Redis slot lock and draft expiry', async () => {
    const result = await service.createDraft(user, dto);

    expect(result.booking.id).toBe(booking.id);
    expect(lockService.acquire).toHaveBeenCalledWith(
      expect.stringContaining(`${address.id}:2099-07-20:${dto.scheduledSlot}`),
    );
    expect(repository.createBooking).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        status: BookingStatus.DRAFT,
        bookingNumber: 'FH-20990720-0001',
      }),
    );
    expect(lockService.setDraftExpiry).toHaveBeenCalledWith(booking.id, 900);
    expect(lockService.release).toHaveBeenCalledWith(expect.any(String), 'lock-token');
    expect(queryCacheService.invalidate).toHaveBeenCalled();
  });

  it('throws when the Redis slot lock cannot be acquired', async () => {
    lockService.acquire.mockResolvedValue(null);

    await expect(service.createDraft(user, dto)).rejects.toThrow(ConflictException);
  });

  it('throws when a slot conflict exists', async () => {
    repository.countSlotConflicts.mockResolvedValue(1);

    await expect(service.createDraft(user, dto)).rejects.toThrow(ConflictException);
    expect(lockService.release).toHaveBeenCalled();
  });

  it('confirms an active draft booking', async () => {
    repository.findDraftForCustomer.mockResolvedValue(booking as any);
    lockService.isDraftActive.mockResolvedValue(true);
    repository.updateBookingStatus.mockResolvedValue({
      ...booking,
      status: BookingStatus.CONFIRMED,
    } as any);

    const result = await service.confirmBooking(user, booking.id, {});

    expect(result.confirmation.status).toBe(BookingStatus.CONFIRMED);
    expect(repository.updateBookingStatus).toHaveBeenCalledWith(
      {},
      booking.id,
      BookingStatus.CONFIRMED,
      user.userId,
    );
    expect(lockService.clearDraftExpiry).toHaveBeenCalledWith(booking.id);
    expect(queryCacheService.invalidate).toHaveBeenCalled();
  });

  it('rejects expired draft confirmation', async () => {
    repository.findDraftForCustomer.mockResolvedValue(booking as any);
    lockService.isDraftActive.mockResolvedValue(false);

    await expect(service.confirmBooking(user, booking.id, {})).rejects.toThrow();
  });

  it('prepares media upload and persists media when URL is supplied', async () => {
    repository.findById.mockResolvedValue({ ...booking, status: BookingStatus.DRAFT } as any);
    storageService.generateKey.mockReturnValue('bookings/booking-uuid-1/photo.jpg');
    storageService.getUploadUrl.mockResolvedValue('https://signed-upload-url');
    repository.createMedia.mockResolvedValue({ id: 'media-uuid-1' } as any);

    const result = await service.prepareMediaUpload(user, booking.id, {
      fileName: 'photo.jpg',
      contentType: 'image/jpeg',
      url: 'https://cdn.fixhub.in/photo.jpg',
    });

    expect(result.uploadUrl).toBe('https://signed-upload-url');
    expect(repository.createMedia).toHaveBeenCalled();
    expect(queryCacheService.invalidate).toHaveBeenCalled();
  });
});
