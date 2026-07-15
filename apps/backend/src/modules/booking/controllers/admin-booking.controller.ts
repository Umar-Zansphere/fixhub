import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { Roles } from '../../../common/decorators/roles.decorator';
import { BookingQueryDto } from '../dto';
import { BookingQueryService } from '../services/booking-query.service';

@ApiTags('Admin Bookings')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin/bookings')
export class AdminBookingController {
  constructor(private readonly bookingQueryService: BookingQueryService) {}

  @Get()
  @ApiOperation({ summary: 'List all bookings for admin' })
  async listBookings(@Query() query: BookingQueryDto) {
    return this.bookingQueryService.listAdmin(query);
  }

  @Get('history')
  @ApiOperation({ summary: 'List historical bookings for admin' })
  async listBookingHistory(@Query() query: BookingQueryDto) {
    return this.bookingQueryService.listAdminHistory(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking details for admin' })
  @ApiParam({ name: 'id', description: 'Booking id' })
  async getBooking(@Param('id') id: string) {
    return this.bookingQueryService.getAdminDetails(id);
  }
}
