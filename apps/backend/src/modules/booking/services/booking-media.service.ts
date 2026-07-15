import { ErrorCodes } from '@fixhub/shared';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, MediaType, Role } from '@prisma/client';

import { AuthenticatedUser } from '../../../common/interfaces/auth.interface';
import { StorageService } from '../../../common/storage/storage.service';
import { CreateBookingMediaBatchDto, CreateBookingMediaDto } from '../dto';
import { BookingMediaRepository } from '../repositories/booking-media.repository';
import { BookingQueryCacheService } from './booking-query-cache.service';

const IMAGE_CONTENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const VIDEO_CONTENT_TYPES = new Set(['video/mp4', 'video/quicktime', 'video/webm']);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const UPLOADABLE_STATUSES: BookingStatus[] = [
  BookingStatus.DRAFT,
  BookingStatus.CONFIRMED,
  BookingStatus.ASSIGNED,
  BookingStatus.ACCEPTED,
  BookingStatus.EN_ROUTE,
  BookingStatus.ARRIVED,
  BookingStatus.IN_PROGRESS,
];

@Injectable()
export class BookingMediaService {
  constructor(
    private readonly mediaRepository: BookingMediaRepository,
    private readonly storageService: StorageService,
    private readonly bookingQueryCacheService: BookingQueryCacheService,
  ) {}

  async prepareUpload(actor: AuthenticatedUser, bookingId: string, dto: CreateBookingMediaDto) {
    const booking = await this.requireBookingAccess(actor, bookingId);
    this.ensureUploadableStatus(booking.status);
    this.validateMedia(dto);

    const key = this.storageService.generateKey(`bookings/${bookingId}`, dto.fileName);
    const uploadUrl = await this.storageService.getUploadUrl({
      key,
      contentType: dto.contentType,
    });
    const media = dto.url
      ? await this.mediaRepository.transaction((tx) =>
          this.mediaRepository.createMedia(tx, bookingId, actor.userId, key, dto),
        )
      : null;

    if (media) {
      await this.bookingQueryCacheService.invalidate();
    }

    return {
      key,
      uploadUrl,
      media,
      metadata: this.metadata(dto, key),
      message: media ? 'Booking media attached successfully' : 'Upload URL generated successfully',
    };
  }

  async prepareBatchUpload(
    actor: AuthenticatedUser,
    bookingId: string,
    dto: CreateBookingMediaBatchDto,
  ) {
    const booking = await this.requireBookingAccess(actor, bookingId);
    this.ensureUploadableStatus(booking.status);

    const uploads = await Promise.all(
      dto.files.map(async (file) => {
        this.validateMedia(file);
        const key = this.storageService.generateKey(`bookings/${bookingId}`, file.fileName);
        const uploadUrl = await this.storageService.getUploadUrl({
          key,
          contentType: file.contentType,
        });
        const media = file.url
          ? await this.mediaRepository.transaction((tx) =>
              this.mediaRepository.createMedia(tx, bookingId, actor.userId, key, file),
            )
          : null;

        return {
          key,
          uploadUrl,
          media,
          metadata: this.metadata(file, key),
        };
      }),
    );

    if (uploads.some((upload) => upload.media)) {
      await this.bookingQueryCacheService.invalidate();
    }

    return { uploads };
  }

  async deleteMedia(actor: AuthenticatedUser, bookingId: string, mediaId: string) {
    const media = await this.mediaRepository.findMediaById(mediaId);

    if (!media || media.bookingId !== bookingId) {
      throw new NotFoundException({
        message: 'Booking media not found',
        errorCode: ErrorCodes.MEDIA_UPLOAD_FAILED,
      });
    }

    this.ensureCanReadBooking(actor, media.booking);
    this.ensureCanDeleteMedia(actor, media.uploadedBy);

    await this.storageService.deleteObject(media.s3Key);
    await this.mediaRepository.transaction((tx) => this.mediaRepository.deleteMedia(tx, mediaId));
    await this.bookingQueryCacheService.invalidate();

    return { message: 'Booking media deleted successfully' };
  }

  private async requireBookingAccess(actor: AuthenticatedUser, bookingId: string) {
    const booking = await this.mediaRepository.findBookingForMedia(bookingId);

    if (!booking) {
      throw new NotFoundException({
        message: 'Booking not found',
        errorCode: ErrorCodes.BOOKING_NOT_FOUND,
      });
    }

    this.ensureCanReadBooking(actor, booking);
    return booking;
  }

  private ensureCanReadBooking(actor: AuthenticatedUser, booking: any) {
    const canRead =
      actor.role === Role.ADMIN ||
      (actor.role === Role.CUSTOMER && booking.customer?.userId === actor.userId) ||
      (actor.role === Role.TECHNICIAN && booking.technician?.userId === actor.userId);

    if (!canRead) {
      throw new ForbiddenException({
        message: 'You do not have access to this booking media',
        errorCode: ErrorCodes.AUTH_FORBIDDEN,
      });
    }
  }

  private ensureCanDeleteMedia(actor: AuthenticatedUser, uploadedBy: string) {
    if (actor.role !== Role.ADMIN && uploadedBy !== actor.userId) {
      throw new ForbiddenException({
        message: 'Only the uploader or an admin can delete this booking media',
        errorCode: ErrorCodes.AUTH_FORBIDDEN,
      });
    }
  }

  private ensureUploadableStatus(status: BookingStatus) {
    if (!UPLOADABLE_STATUSES.includes(status)) {
      throw new BadRequestException({
        message: 'Media cannot be uploaded for this booking status',
        errorCode: ErrorCodes.BOOKING_INVALID_STATUS,
      });
    }
  }

  private validateMedia(dto: CreateBookingMediaDto) {
    const type = dto.type ?? this.inferMediaType(dto.contentType);
    const allowedContentTypes = type === MediaType.VIDEO ? VIDEO_CONTENT_TYPES : IMAGE_CONTENT_TYPES;
    const maxBytes = type === MediaType.VIDEO ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;

    if (!allowedContentTypes.has(dto.contentType)) {
      throw new BadRequestException({
        message: `${type} content type is not supported`,
        errorCode: ErrorCodes.MEDIA_TYPE_UNSUPPORTED,
      });
    }

    if (dto.sizeBytes && dto.sizeBytes > maxBytes) {
      throw new BadRequestException({
        message: `${type} file size exceeds the allowed limit`,
        errorCode: ErrorCodes.MEDIA_SIZE_EXCEEDED,
      });
    }
  }

  private inferMediaType(contentType: string) {
    return contentType.startsWith('video/') ? MediaType.VIDEO : MediaType.IMAGE;
  }

  private metadata(dto: CreateBookingMediaDto, key: string) {
    return {
      fileName: dto.fileName,
      contentType: dto.contentType,
      sizeBytes: dto.sizeBytes,
      type: dto.type ?? this.inferMediaType(dto.contentType),
      uploadPhase: dto.uploadPhase ?? 'BEFORE_SERVICE',
      s3Key: key,
    };
  }
}
