import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/auth.interface';
import { AssignTechnicianDto, BookingQueryDto } from '../dto';
import { BookingQueryService } from '../services/booking-query.service';
import { BookingService } from '../services/booking.service';

@ApiTags('Admin Bookings')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin/bookings')
export class AdminBookingController {
  constructor(
    private readonly bookingQueryService: BookingQueryService,
    private readonly bookingService: BookingService,
  ) {}

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

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign a technician to a booking manually' })
  @ApiParam({ name: 'id', description: 'Booking id' })
  async assignTechnician(
    @Param('id') id: string,
    @Body() dto: AssignTechnicianDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bookingService.assignTechnician(id, dto.technicianId, user);
  }
}
