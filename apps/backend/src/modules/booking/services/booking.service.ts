import { ErrorCodes } from '@fixhub/shared';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, Role } from '@prisma/client';

import { PaginationDto } from '../../../common/dto/pagination.dto';
import { AuthenticatedUser } from '../../../common/interfaces/auth.interface';
import { StorageService } from '../../../common/storage/storage.service';
import { BookingSummaryDto, ConfirmBookingDto, CreateBookingDto, CreateBookingMediaDto, CreateReviewDto, ProposeRevisionDto } from '../dto';
import { BookingRepository } from '../repositories/booking.repository';
import { BookingLockService } from './booking-lock.service';
import { BookingQueryCacheService } from './booking-query-cache.service';

const DRAFT_TTL_SECONDS = 15 * 60;

@Injectable()
export class BookingService {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly bookingLockService: BookingLockService,
    private readonly storageService: StorageService,
    private readonly bookingQueryCacheService: BookingQueryCacheService,
  ) {}

  async listByUser(userId: string, role: string, pagination: PaginationDto) {
    return this.bookingRepository.findByUser(userId, role, pagination);
  }

  async findById(id: string, user: AuthenticatedUser) {
    const booking = await this.bookingRepository.findById(id);
    if (!booking) {
      throw new NotFoundException({
        message: 'Booking not found',
        errorCode: ErrorCodes.BOOKING_NOT_FOUND,
      });
    }
    return booking;
  }

  async getSummary(user: AuthenticatedUser, dto: BookingSummaryDto) {
    const context = await this.validateCreationContext(user, dto);
    await this.ensureSlotAvailable(
      context.serviceArea.id,
      context.service.id,
      context.address.id,
      context.scheduledDate,
      dto.scheduledSlot,
    );

    return this.buildSummary(dto, context);
  }

  async createDraft(user: AuthenticatedUser, dto: CreateBookingDto) {
    const context = await this.validateCreationContext(user, dto);
    const lockKey = this.slotLockKey(context.address.id, context.scheduledDate, dto.scheduledSlot);
    const token = await this.bookingLockService.acquire(lockKey);

    if (!token) {
      throw new ConflictException({
        message: 'Selected slot is being reserved. Please try again.',
        errorCode: ErrorCodes.BOOKING_SLOT_UNAVAILABLE,
      });
    }

    try {
      await this.ensureSlotAvailable(
        context.serviceArea.id,
        context.service.id,
        context.address.id,
        context.scheduledDate,
        dto.scheduledSlot,
      );
      const bookingNumber = await this.bookingLockService.nextBookingNumber(new Date());

      const booking = await this.bookingRepository.transaction((tx) =>
        this.bookingRepository.createBooking(tx, {
          bookingNumber,
          customerId: context.customer.id,
          subServiceId: context.service.id,
          addressId: context.address.id,
          scheduledDate: context.scheduledDate,
          scheduledSlot: dto.scheduledSlot,
          description: dto.description,
          totalAmount: Number(context.service.basePrice),
          status: BookingStatus.DRAFT,
          userId: user.userId,
        }),
      );

      await this.bookingLockService.setDraftExpiry(booking.id, DRAFT_TTL_SECONDS);
      await this.bookingQueryCacheService.invalidate();

      return {
        booking,
        summary: this.buildSummary(dto, context),
        draftExpiresInSeconds: DRAFT_TTL_SECONDS,
      };
    } finally {
      await this.bookingLockService.release(lockKey, token);
    }
  }

  async confirmBooking(user: AuthenticatedUser, bookingId: string, dto: ConfirmBookingDto) {
    const customer = await this.validateCustomer(user);
    const draft = await this.bookingRepository.findDraftForCustomer(bookingId, customer.id);

    if (!draft) {
      throw new NotFoundException({
        message: 'Draft booking not found',
        errorCode: ErrorCodes.BOOKING_NOT_FOUND,
      });
    }

    const isDraftActive = await this.bookingLockService.isDraftActive(bookingId);

    if (!isDraftActive) {
      throw new BadRequestException({
        message: 'Draft booking has expired. Please create a new draft.',
        errorCode: ErrorCodes.BOOKING_INVALID_STATUS,
      });
    }

    const context = dto.booking
      ? await this.validateCreationContext(user, dto.booking)
      : {
          customer,
          address: draft.address,
          service: draft.subService,
          serviceArea: await this.requireServiceArea(draft.address.pincode),
          scheduledDate: draft.scheduledDate,
        };
    const scheduledSlot = dto.booking?.scheduledSlot ?? draft.scheduledSlot;
    const lockKey = this.slotLockKey(context.address.id, context.scheduledDate, scheduledSlot);
    const token = await this.bookingLockService.acquire(lockKey);

    if (!token) {
      throw new ConflictException({
        message: 'Selected slot is being reserved. Please try again.',
        errorCode: ErrorCodes.BOOKING_SLOT_UNAVAILABLE,
      });
    }

    try {
      await this.ensureSlotAvailable(
        context.serviceArea.id,
        context.service.id,
        context.address.id,
        context.scheduledDate,
        scheduledSlot,
        draft.id,
      );

      const confirmed = await this.bookingRepository.transaction((tx) =>
        dto.booking
          ? this.bookingRepository.updateDraftAndConfirm(tx, draft.id, {
              subServiceId: context.service.id,
              addressId: context.address.id,
              scheduledDate: context.scheduledDate,
              scheduledSlot,
              description: dto.booking.description,
              totalAmount: Number(context.service.basePrice),
              userId: user.userId,
            })
          : this.bookingRepository.updateBookingStatus(
              tx,
              draft.id,
              BookingStatus.CONFIRMED,
              user.userId,
            ),
      );

      await this.bookingLockService.clearDraftExpiry(bookingId);
      await this.bookingQueryCacheService.invalidate();

      return {
        booking: confirmed,
        confirmation: {
          bookingId: confirmed.id,
          bookingNumber: confirmed.bookingNumber,
          status: confirmed.status,
          scheduledDate: confirmed.scheduledDate,
          scheduledSlot: confirmed.scheduledSlot,
        },
      };
    } finally {
      await this.bookingLockService.release(lockKey, token);
    }
  }

  async prepareMediaUpload(
    user: AuthenticatedUser,
    bookingId: string,
    dto: CreateBookingMediaDto,
  ) {
    const customer = await this.validateCustomer(user);
    const booking = await this.bookingRepository.findById(bookingId);

    if (!booking || booking.customerId !== customer.id) {
      throw new NotFoundException({
        message: 'Booking not found',
        errorCode: ErrorCodes.BOOKING_NOT_FOUND,
      });
    }

    const mediaAllowedStatuses: BookingStatus[] = [BookingStatus.DRAFT, BookingStatus.CONFIRMED];

    if (!mediaAllowedStatuses.includes(booking.status)) {
      throw new BadRequestException({
        message: 'Media can be attached only during booking creation',
        errorCode: ErrorCodes.BOOKING_INVALID_STATUS,
      });
    }

    const key = this.storageService.generateKey(`bookings/${bookingId}`, dto.fileName);
    const uploadUrl = await this.storageService.getUploadUrl({
      key,
      contentType: dto.contentType,
    });
    const media = dto.url
      ? await this.bookingRepository.transaction((tx) =>
          this.bookingRepository.createMedia(tx, bookingId, user.userId, key, dto),
        )
      : null;

    if (media) {
      await this.bookingQueryCacheService.invalidate();
    }

    return {
      key,
      uploadUrl,
      media,
      message: dto.url ? 'Booking media attached successfully' : 'Upload URL generated successfully',
    };
  }

  async assignTechnician(bookingId: string, technicianId: string, actor: AuthenticatedUser) {
    const booking = await this.bookingRepository.findById(bookingId);

    if (!booking) {
      throw new NotFoundException({
        message: 'Booking not found',
        errorCode: ErrorCodes.BOOKING_NOT_FOUND,
      });
    }

    if (booking.status !== BookingStatus.CONFIRMED && booking.status !== BookingStatus.PENDING_PAYMENT) {
      throw new BadRequestException({
        message: 'Can only assign technicians to confirmed or pending payment bookings',
        errorCode: ErrorCodes.BOOKING_INVALID_STATUS,
      });
    }

    if (booking.technicianId === technicianId) {
      throw new ConflictException({
        message: 'Technician is already assigned to this booking',
        errorCode: ErrorCodes.BOOKING_ALREADY_ASSIGNED,
      });
    }

    const updated = await this.bookingRepository.transaction(async (tx) => {
      const assigned = await this.bookingRepository.assignTechnician(
        tx,
        bookingId,
        technicianId,
        actor.userId,
      );

      await this.bookingRepository.createTimelineEntry(tx, {
        bookingId,
        status: BookingStatus.ASSIGNED,
        changedByUserId: actor.userId,
        note: `Admin assigned technician to booking`,
      });

      return assigned;
    });

    await this.bookingQueryCacheService.invalidate();

    return updated;
  }

  async submitReview(user: AuthenticatedUser, bookingId: string, dto: CreateReviewDto) {
    const customer = await this.validateCustomer(user);
    const booking = await this.bookingRepository.findById(bookingId);

    if (!booking || booking.customerId !== customer.id) {
      throw new NotFoundException({ message: 'Booking not found', errorCode: ErrorCodes.BOOKING_NOT_FOUND });
    }

    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException({
        message: 'Reviews can only be submitted for completed bookings',
        errorCode: ErrorCodes.BOOKING_INVALID_STATUS,
      });
    }

    if (booking.review) {
      throw new ConflictException({ message: 'This booking has already been reviewed' });
    }

    if (!booking.technicianId) {
      throw new BadRequestException({ message: 'No technician assigned to this booking' });
    }

    const review = await this.bookingRepository.createReview(
      bookingId,
      customer.id,
      booking.technicianId,
      dto.rating,
      dto.comment,
    );

    await this.bookingQueryCacheService.invalidate();
    return review;
  }

  async proposeRevision(user: AuthenticatedUser, bookingId: string, dto: ProposeRevisionDto) {
    const technicianId = await this.resolveLinkedTechnicianId(user);
    const booking = await this.bookingRepository.findById(bookingId);

    if (!booking || booking.technicianId !== technicianId) {
      throw new NotFoundException({ message: 'Job not found', errorCode: ErrorCodes.BOOKING_NOT_FOUND });
    }

    if (booking.status !== BookingStatus.IN_PROGRESS) {
      throw new BadRequestException({
        message: 'Price revision can only be proposed when job is IN_PROGRESS',
        errorCode: ErrorCodes.BOOKING_INVALID_STATUS,
      });
    }

    const updated = await this.bookingRepository.transaction((tx) =>
      this.bookingRepository.setPriceRevision(tx, bookingId, dto.revisedAmount, dto.note, user.userId),
    );

    await this.bookingQueryCacheService.invalidate();
    return updated;
  }

  async approveRevision(user: AuthenticatedUser, bookingId: string) {
    const customer = await this.validateCustomer(user);
    const booking = await this.bookingRepository.findById(bookingId);

    if (!booking || booking.customerId !== customer.id) {
      throw new NotFoundException({ message: 'Booking not found', errorCode: ErrorCodes.BOOKING_NOT_FOUND });
    }

    if (booking.status !== BookingStatus.PRICE_REVISION_PENDING) {
      throw new BadRequestException({
        message: 'No pending price revision for this booking',
        errorCode: ErrorCodes.BOOKING_INVALID_STATUS,
      });
    }

    const updated = await this.bookingRepository.transaction((tx) =>
      this.bookingRepository.approveRevision(tx, bookingId, user.userId),
    );

    await this.bookingQueryCacheService.invalidate();
    return updated;
  }

  async rejectRevision(user: AuthenticatedUser, bookingId: string) {
    const customer = await this.validateCustomer(user);
    const booking = await this.bookingRepository.findById(bookingId);

    if (!booking || booking.customerId !== customer.id) {
      throw new NotFoundException({ message: 'Booking not found', errorCode: ErrorCodes.BOOKING_NOT_FOUND });
    }

    if (booking.status !== BookingStatus.PRICE_REVISION_PENDING) {
      throw new BadRequestException({
        message: 'No pending price revision for this booking',
        errorCode: ErrorCodes.BOOKING_INVALID_STATUS,
      });
    }

    const updated = await this.bookingRepository.transaction((tx) =>
      this.bookingRepository.updateLifecycleStatus(
        tx,
        bookingId,
        { status: BookingStatus.CANCELLED, cancelReason: 'Customer rejected technician price revision' },
        user.userId,
      ),
    );

    await this.bookingQueryCacheService.invalidate();
    return updated;
  }

  /** Resolve the technician profile ID for a technician-role user. */
  private async resolveLinkedTechnicianId(user: AuthenticatedUser): Promise<string> {
    if (user.role !== Role.TECHNICIAN) {
      throw new ForbiddenException({ message: 'Only technicians can perform this action', errorCode: ErrorCodes.AUTH_FORBIDDEN });
    }
    const technician = await this.bookingRepository.findTechnicianProfileByUserId(user.userId);
    if (!technician) {
      throw new NotFoundException({ message: 'Technician profile not found', errorCode: ErrorCodes.TECHNICIAN_NOT_FOUND });
    }
    return technician.id;
  }

  private async validateCreationContext(user: AuthenticatedUser, dto: CreateBookingDto) {
    const customer = await this.validateCustomer(user);
    const address = await this.bookingRepository.findAddressForCustomer(customer.id, dto.addressId);

    if (!address) {
      throw new NotFoundException({
        message: 'Address not found',
        errorCode: ErrorCodes.CUSTOMER_ADDRESS_NOT_FOUND,
      });
    }

    const serviceArea = await this.requireServiceArea(address.pincode);
    const service = await this.bookingRepository.findActiveService(dto.subServiceId);

    if (!service) {
      throw new NotFoundException({
        message: 'Service not found',
        errorCode: ErrorCodes.SERVICE_NOT_FOUND,
      });
    }

    const scheduledDate = this.parseScheduledDate(dto.scheduledDate, dto.scheduledSlot);

    return { customer, address, serviceArea, service, scheduledDate };
  }

  private async validateCustomer(user: AuthenticatedUser) {
    if (user.role !== Role.CUSTOMER) {
      throw new ForbiddenException({
        message: 'Only customers can create bookings',
        errorCode: ErrorCodes.AUTH_FORBIDDEN,
      });
    }

    const customer = await this.bookingRepository.findCustomerByUserId(user.userId);

    if (!customer) {
      throw new NotFoundException({
        message: 'Customer not found',
        errorCode: ErrorCodes.CUSTOMER_NOT_FOUND,
      });
    }

    return customer;
  }

  private async requireServiceArea(pincode: string) {
    const serviceArea = await this.bookingRepository.findActiveServiceAreaByPincode(pincode);

    if (!serviceArea) {
      throw new BadRequestException({
        message: 'Address pincode is outside active service coverage',
        errorCode: ErrorCodes.SERVICE_AREA_NOT_FOUND,
      });
    }

    return serviceArea;
  }

  async getAvailableSlots(query: import('../dto/create-booking.dto').AvailableSlotsQueryDto) {
    const serviceArea = await this.requireServiceArea(query.pincode);
    const capacity = await this.bookingRepository.countServiceCapacity(
      serviceArea.id,
      query.subServiceId,
    );

    if (capacity === 0) {
      return [];
    }

    const scheduledDate = new Date(`${query.date}T00:00:00.000Z`);
    const slots = [
      '09:00-11:00',
      '11:00-13:00',
      '13:00-15:00',
      '15:00-17:00',
      '17:00-19:00',
    ];

    const availableSlots: string[] = [];
    const draftCreatedAfter = new Date(Date.now() - DRAFT_TTL_SECONDS * 1000);

    for (const slot of slots) {
      // Check if the slot is in the past
      const [startHour, startMinute] = slot.split('-')[0].split(':').map(Number);
      const slotTime = new Date(scheduledDate);
      slotTime.setUTCHours(startHour, startMinute);
      
      // If it's today and the slot is in the past (adding 1 hour buffer for now), skip
      if (slotTime.getTime() < Date.now() + 60 * 60 * 1000) {
        continue;
      }

      const activeBookings = await this.bookingRepository.countSlotBookings(
        serviceArea.id,
        query.subServiceId,
        scheduledDate,
        slot,
        draftCreatedAfter,
      );

      if (activeBookings < capacity) {
        availableSlots.push(slot);
      }
    }

    return availableSlots;
  }

  private async ensureSlotAvailable(
    serviceAreaId: string,
    subServiceId: string,
    addressId: string,
    scheduledDate: Date,
    scheduledSlot: string,
    excludeBookingId?: string,
  ) {
    // 1. Check if the customer's address is already booked
    const conflicts = await this.bookingRepository.countSlotConflicts({
      addressId,
      scheduledDate,
      scheduledSlot,
      draftCreatedAfter: new Date(Date.now() - DRAFT_TTL_SECONDS * 1000),
      excludeBookingId,
    });

    if (conflicts > 0) {
      throw new ConflictException({
        message: 'You already have a booking at this time',
        errorCode: ErrorCodes.BOOKING_SLOT_UNAVAILABLE,
      });
    }

    // 2. Check if the system has capacity
    const capacity = await this.bookingRepository.countServiceCapacity(serviceAreaId, subServiceId);
    if (capacity === 0) {
      throw new ConflictException({
        message: 'No technicians are available in your area for this service',
        errorCode: ErrorCodes.BOOKING_SLOT_UNAVAILABLE,
      });
    }

    const activeBookings = await this.bookingRepository.countSlotBookings(
      serviceAreaId,
      subServiceId,
      scheduledDate,
      scheduledSlot,
      new Date(Date.now() - DRAFT_TTL_SECONDS * 1000),
    );

    // activeBookings includes the current booking if it's a DRAFT and we're confirming,
    // so we need to account for excludeBookingId if we were counting the same booking.
    // Since countSlotBookings doesn't take excludeBookingId, we could have a false positive
    // if a user is confirming their own draft and that draft brings activeBookings == capacity.
    // Actually, countSlotBookings counts all bookings. If the user is confirming their draft,
    // the draft is ALREADY in activeBookings. 
    // Thus activeBookings <= capacity is fine if we are confirming.
    // If it's a new draft, we need activeBookings < capacity.
    if (excludeBookingId) {
      if (activeBookings > capacity) {
        throw new ConflictException({
          message: 'Selected slot is no longer available',
          errorCode: ErrorCodes.BOOKING_SLOT_UNAVAILABLE,
        });
      }
    } else {
      if (activeBookings >= capacity) {
        throw new ConflictException({
          message: 'Selected slot is no longer available',
          errorCode: ErrorCodes.BOOKING_SLOT_UNAVAILABLE,
        });
      }
    }
  }

  private parseScheduledDate(scheduledDate: string, scheduledSlot: string) {
    const [startTime] = scheduledSlot.split('-');
    const date = new Date(`${scheduledDate}T${startTime}:00.000Z`);

    if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
      throw new BadRequestException({
        message: 'Scheduled slot must be in the future',
        errorCode: ErrorCodes.BOOKING_SLOT_UNAVAILABLE,
      });
    }

    return new Date(`${scheduledDate}T00:00:00.000Z`);
  }

  private buildSummary(
    dto: CreateBookingDto,
    context: Awaited<ReturnType<BookingService['validateCreationContext']>>,
  ) {
    return {
      service: {
        id: context.service.id,
        name: context.service.name,
        category: context.service.category.name,
        basePrice: Number(context.service.basePrice),
        estimatedDurationMins: context.service.estimatedDurationMins,
      },
      address: {
        id: context.address.id,
        label: context.address.label,
        line1: context.address.line1,
        city: context.address.city,
        state: context.address.state,
        pincode: context.address.pincode,
      },
      serviceArea: {
        id: context.serviceArea.id,
        name: context.serviceArea.name,
        pincode: context.serviceArea.pincode,
      },
      schedule: {
        date: dto.scheduledDate,
        slot: dto.scheduledSlot,
      },
      pricing: {
        subtotal: Number(context.service.basePrice),
        total: Number(context.service.basePrice),
        currency: 'INR',
      },
      description: dto.description,
    };
  }

  private slotLockKey(addressId: string, scheduledDate: Date, scheduledSlot: string) {
    return `${addressId}:${scheduledDate.toISOString().slice(0, 10)}:${scheduledSlot}`;
  }
}
