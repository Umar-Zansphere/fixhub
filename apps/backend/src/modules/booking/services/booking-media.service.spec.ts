import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BookingStatus, MediaType, MediaUploadPhase, Role } from '@prisma/client';

import { StorageService } from '../../../common/storage/storage.service';
import { BookingMediaRepository } from '../repositories/booking-media.repository';
import { BookingMediaService } from './booking-media.service';
import { BookingQueryCacheService } from './booking-query-cache.service';

describe('BookingMediaService', () => {
  let service: BookingMediaService;
  let repository: jest.Mocked<BookingMediaRepository>;
  let storageService: jest.Mocked<StorageService>;
  let cacheService: jest.Mocked<BookingQueryCacheService>;

  const actor = {
    userId: 'customer-user-uuid-1',
    phone: '+919876543210',
    role: Role.CUSTOMER,
  };
  const booking = {
    id: 'booking-uuid-1',
    status: BookingStatus.CONFIRMED,
    customer: { userId: actor.userId },
    technician: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingMediaService,
        {
          provide: BookingMediaRepository,
          useValue: {
            findBookingForMedia: jest.fn(),
            findMediaById: jest.fn(),
            createMedia: jest.fn(),
            deleteMedia: jest.fn(),
            transaction: jest.fn((fn) => fn({})),
          },
        },
        {
          provide: StorageService,
          useValue: {
            generateKey: jest.fn(),
            getUploadUrl: jest.fn(),
            deleteObject: jest.fn(),
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

    service = module.get(BookingMediaService);
    repository = module.get(BookingMediaRepository);
    storageService = module.get(StorageService);
    cacheService = module.get(BookingQueryCacheService);

    repository.findBookingForMedia.mockResolvedValue(booking as any);
    storageService.generateKey.mockReturnValue('bookings/booking-uuid-1/photo.jpg');
    storageService.getUploadUrl.mockResolvedValue('https://signed-upload-url');
  });

  it('generates a signed upload URL with metadata for an image', async () => {
    const result = await service.prepareUpload(actor, booking.id, {
      fileName: 'photo.jpg',
      contentType: 'image/jpeg',
      sizeBytes: 1024,
      type: MediaType.IMAGE,
    });

    expect(result.uploadUrl).toBe('https://signed-upload-url');
    expect(result.metadata).toEqual(
      expect.objectContaining({
        fileName: 'photo.jpg',
        contentType: 'image/jpeg',
        sizeBytes: 1024,
        type: MediaType.IMAGE,
        s3Key: 'bookings/booking-uuid-1/photo.jpg',
      }),
    );
    expect(repository.createMedia).not.toHaveBeenCalled();
  });

  it('persists media when URL is supplied', async () => {
    repository.createMedia.mockResolvedValue({ id: 'media-uuid-1' } as any);

    const result = await service.prepareUpload(actor, booking.id, {
      fileName: 'photo.jpg',
      contentType: 'image/jpeg',
      url: 'https://cdn.fixhub.in/photo.jpg',
      uploadPhase: MediaUploadPhase.BEFORE_SERVICE,
    });

    expect(result.media).toEqual({ id: 'media-uuid-1' });
    expect(repository.createMedia).toHaveBeenCalledWith(
      {},
      booking.id,
      actor.userId,
      'bookings/booking-uuid-1/photo.jpg',
      expect.objectContaining({ url: 'https://cdn.fixhub.in/photo.jpg' }),
    );
    expect(cacheService.invalidate).toHaveBeenCalled();
  });

  it('generates signed URLs for multiple image and video files', async () => {
    storageService.generateKey
      .mockReturnValueOnce('bookings/booking-uuid-1/photo.jpg')
      .mockReturnValueOnce('bookings/booking-uuid-1/video.mp4');

    const result = await service.prepareBatchUpload(actor, booking.id, {
      files: [
        { fileName: 'photo.jpg', contentType: 'image/jpeg', type: MediaType.IMAGE },
        { fileName: 'video.mp4', contentType: 'video/mp4', type: MediaType.VIDEO },
      ],
    });

    expect(result.uploads).toHaveLength(2);
    expect(storageService.getUploadUrl).toHaveBeenCalledTimes(2);
  });

  it('rejects unsupported content types', async () => {
    await expect(
      service.prepareUpload(actor, booking.id, {
        fileName: 'script.svg',
        contentType: 'image/svg+xml',
        type: MediaType.IMAGE,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects oversized videos', async () => {
    await expect(
      service.prepareUpload(actor, booking.id, {
        fileName: 'large.mp4',
        contentType: 'video/mp4',
        type: MediaType.VIDEO,
        sizeBytes: 150 * 1024 * 1024,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects upload for inaccessible booking', async () => {
    repository.findBookingForMedia.mockResolvedValue({
      ...booking,
      customer: { userId: 'another-customer-user' },
    } as any);

    await expect(
      service.prepareUpload(actor, booking.id, {
        fileName: 'photo.jpg',
        contentType: 'image/jpeg',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('deletes S3 object and media row for uploader', async () => {
    repository.findMediaById.mockResolvedValue({
      id: 'media-uuid-1',
      bookingId: booking.id,
      uploadedBy: actor.userId,
      s3Key: 'bookings/booking-uuid-1/photo.jpg',
      booking,
    } as any);

    const result = await service.deleteMedia(actor, booking.id, 'media-uuid-1');

    expect(result.message).toBe('Booking media deleted successfully');
    expect(storageService.deleteObject).toHaveBeenCalledWith('bookings/booking-uuid-1/photo.jpg');
    expect(repository.deleteMedia).toHaveBeenCalledWith({}, 'media-uuid-1');
    expect(cacheService.invalidate).toHaveBeenCalled();
  });

  it('rejects delete by non-uploader non-admin', async () => {
    repository.findMediaById.mockResolvedValue({
      id: 'media-uuid-1',
      bookingId: booking.id,
      uploadedBy: 'other-user',
      s3Key: 'bookings/booking-uuid-1/photo.jpg',
      booking,
    } as any);

    await expect(service.deleteMedia(actor, booking.id, 'media-uuid-1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('throws when media is missing', async () => {
    repository.findMediaById.mockResolvedValue(null);

    await expect(service.deleteMedia(actor, booking.id, 'missing')).rejects.toThrow(
      NotFoundException,
    );
  });
});
