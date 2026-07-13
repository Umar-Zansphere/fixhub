import { ErrorCodes } from '@fixhub/shared';
import { Injectable, NotFoundException } from '@nestjs/common';

import { PaginationDto } from '../../../common/dto/pagination.dto';
import { AuthenticatedUser } from '../../../common/interfaces/auth.interface';
import { BookingRepository } from '../repositories/booking.repository';

@Injectable()
export class BookingService {
  constructor(private readonly bookingRepository: BookingRepository) {}

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

  // TODO: Implement create, cancel, status update, media upload
}
