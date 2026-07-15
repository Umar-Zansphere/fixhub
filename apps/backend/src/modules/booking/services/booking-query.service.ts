import { ErrorCodes } from '@fixhub/shared';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';

import { AuthenticatedUser } from '../../../common/interfaces/auth.interface';
import { BookingQueryDto } from '../dto';
import { BookingRepository, BookingQueryScope } from '../repositories/booking.repository';
import { BookingQueryCacheService } from './booking-query-cache.service';

@Injectable()
export class BookingQueryService {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly cacheService: BookingQueryCacheService,
  ) {}

  async listForActor(actor: AuthenticatedUser, query: BookingQueryDto) {
    const scope = this.scopeForActor(actor);
    return this.cached(`list:${actor.role}:${actor.userId}:${this.queryKey(query)}`, () =>
      this.bookingRepository.listBookings(query, scope),
    );
  }

  async listHistoryForActor(actor: AuthenticatedUser, query: BookingQueryDto) {
    const scope = this.scopeForActor(actor);
    return this.cached(`history:${actor.role}:${actor.userId}:${this.queryKey(query)}`, () =>
      this.bookingRepository.listBookingHistory(query, scope),
    );
  }

  async listAdmin(query: BookingQueryDto) {
    return this.cached(`admin:list:${this.queryKey(query)}`, () =>
      this.bookingRepository.listBookings(query),
    );
  }

  async listAdminHistory(query: BookingQueryDto) {
    return this.cached(`admin:history:${this.queryKey(query)}`, () =>
      this.bookingRepository.listBookingHistory(query),
    );
  }

  async getDetailsForActor(actor: AuthenticatedUser, bookingId: string) {
    const booking = await this.cached(`detail:${actor.role}:${actor.userId}:${bookingId}`, () =>
      this.bookingRepository.findBookingDetails(bookingId),
    );

    if (!booking) {
      throw new NotFoundException({
        message: 'Booking not found',
        errorCode: ErrorCodes.BOOKING_NOT_FOUND,
      });
    }

    this.ensureCanRead(actor, booking);
    return booking;
  }

  async getAdminDetails(bookingId: string) {
    const booking = await this.cached(`admin:detail:${bookingId}`, () =>
      this.bookingRepository.findBookingDetails(bookingId),
    );

    if (!booking) {
      throw new NotFoundException({
        message: 'Booking not found',
        errorCode: ErrorCodes.BOOKING_NOT_FOUND,
      });
    }

    return booking;
  }

  private scopeForActor(actor: AuthenticatedUser): BookingQueryScope {
    if (actor.role === Role.CUSTOMER) {
      return { customerUserId: actor.userId };
    }

    if (actor.role === Role.TECHNICIAN) {
      return { technicianUserId: actor.userId };
    }

    return {};
  }

  private ensureCanRead(actor: AuthenticatedUser, booking: any) {
    if (actor.role === Role.ADMIN) {
      return;
    }

    const canRead =
      (actor.role === Role.CUSTOMER && booking.customer?.userId === actor.userId) ||
      (actor.role === Role.TECHNICIAN && booking.technician?.userId === actor.userId);

    if (!canRead) {
      throw new ForbiddenException({
        message: 'You do not have access to this booking',
        errorCode: ErrorCodes.AUTH_FORBIDDEN,
      });
    }
  }

  private async cached<T>(key: string, loader: () => Promise<T>): Promise<T> {
    const cached = await this.cacheService.get<T>(key);

    if (cached) {
      return cached;
    }

    const value = await loader();
    await this.cacheService.set(key, value);
    return value;
  }

  private queryKey(query: BookingQueryDto) {
    return JSON.stringify({
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      search: query.search,
      status: query.status,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      customerId: query.customerId,
      technicianId: query.technicianId,
      subServiceId: query.subServiceId,
      categoryId: query.categoryId,
      pincode: query.pincode,
      includeHistory: query.includeHistory,
    });
  }
}
