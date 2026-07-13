import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation,ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { AuthenticatedUser } from '../../../common/interfaces/auth.interface';
import { BookingService } from '../services/booking.service';

@ApiTags('Bookings')
@ApiBearerAuth()
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get()
  @ApiOperation({ summary: 'List bookings for current user' })
  async listBookings(@CurrentUser() user: AuthenticatedUser, @Query() pagination: PaginationDto) {
    return this.bookingService.listByUser(user.userId, user.role, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking details' })
  async getBooking(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.bookingService.findById(id, user);
  }

  // TODO: Add endpoints for:
  // POST / — Create booking
  // PATCH /:id/cancel — Cancel booking
  // PATCH /:id/status — Update status (technician)
  // POST /:id/media — Upload media
  // GET /:id/status-history — Get status history
}
