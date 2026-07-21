import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/auth.interface';
import {
  BookingQueryDto,
  BookingSummaryDto,
  CreateBookingMediaBatchDto,
  ConfirmBookingDto,
  CreateBookingDto,
  CreateBookingMediaDto,
  CreateReviewDto,
  UpdateBookingStatusDto,
} from '../dto';
import { BookingLifecycleService } from '../services/booking-lifecycle.service';
import { BookingMediaService } from '../services/booking-media.service';
import { BookingQueryService } from '../services/booking-query.service';
import { BookingService } from '../services/booking.service';

@ApiTags('Bookings')
@ApiBearerAuth()
@Controller('bookings')
export class BookingController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly bookingLifecycleService: BookingLifecycleService,
    private readonly bookingQueryService: BookingQueryService,
    private readonly bookingMediaService: BookingMediaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List bookings for current user' })
  async listBookings(@CurrentUser() user: AuthenticatedUser, @Query() query: BookingQueryDto) {
    return this.bookingQueryService.listForActor(user, query);
  }

  @Get('history')
  @ApiOperation({ summary: 'List completed, cancelled, and failed bookings for current user' })
  async listBookingHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: BookingQueryDto,
  ) {
    return this.bookingQueryService.listHistoryForActor(user, query);
  }

  @Get('available-slots')
  @ApiOperation({ summary: 'Get available time slots for a service in a given area on a specific date' })
  async getAvailableSlots(@Query() query: import('../dto/create-booking.dto').AvailableSlotsQueryDto) {
    return this.bookingService.getAvailableSlots(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking details' })
  async getBooking(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.bookingQueryService.getDetailsForActor(user, id);
  }

  @Post('summary')
  @ApiOperation({ summary: 'Validate booking request and return booking summary' })
  @ApiResponse({ status: 201, description: 'Booking summary returned' })
  async getSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: BookingSummaryDto,
  ) {
    return this.bookingService.getSummary(user, dto);
  }

  @Post('draft')
  @ApiOperation({ summary: 'Create draft booking with expiry' })
  @ApiResponse({ status: 201, description: 'Draft booking created' })
  async createDraft(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookingService.createDraft(user, dto);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm draft booking' })
  @ApiParam({ name: 'id', description: 'Draft booking id' })
  @ApiResponse({ status: 201, description: 'Booking confirmed' })
  async confirmBooking(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ConfirmBookingDto,
  ) {
    return this.bookingService.confirmBooking(user, id, dto);
  }

  @Post(':id/media')
  @ApiOperation({ summary: 'Prepare booking media upload and optionally attach uploaded media' })
  @ApiParam({ name: 'id', description: 'Booking id' })
  @ApiResponse({ status: 201, description: 'Booking media upload prepared' })
  async prepareMediaUpload(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateBookingMediaDto,
  ) {
    return this.bookingMediaService.prepareUpload(user, id, dto);
  }

  @Post(':id/media/batch')
  @ApiOperation({ summary: 'Prepare multiple booking media upload URLs' })
  @ApiParam({ name: 'id', description: 'Booking id' })
  @ApiResponse({ status: 201, description: 'Booking media upload URLs prepared' })
  async prepareMediaBatchUpload(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateBookingMediaBatchDto,
  ) {
    return this.bookingMediaService.prepareBatchUpload(user, id, dto);
  }

  @Delete(':id/media/:mediaId')
  @ApiOperation({ summary: 'Delete booking media' })
  @ApiParam({ name: 'id', description: 'Booking id' })
  @ApiParam({ name: 'mediaId', description: 'Booking media id' })
  @ApiResponse({ status: 200, description: 'Booking media deleted' })
  async deleteMedia(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('mediaId') mediaId: string,
  ) {
    return this.bookingMediaService.deleteMedia(user, id, mediaId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Transition booking status through the lifecycle state machine' })
  @ApiParam({ name: 'id', description: 'Booking id' })
  @ApiResponse({ status: 201, description: 'Booking status transitioned' })
  async updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingLifecycleService.transition(id, user, dto);
  }

  // ── Reviews ──────────────────────────────────────────────────────

  @Post(':id/review')
  @ApiOperation({ summary: 'Submit a rating and review for a completed booking (CUSTOMER only)' })
  @ApiParam({ name: 'id', description: 'Booking id' })
  @ApiResponse({ status: 201, description: 'Review created' })
  async submitReview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.bookingService.submitReview(user, id, dto);
  }

  // ── Price Revision ───────────────────────────────────────────────

  @Patch(':id/approve-revision')
  @ApiOperation({ summary: 'Customer approves technician price revision' })
  @ApiParam({ name: 'id', description: 'Booking id' })
  @ApiResponse({ status: 200, description: 'Revised amount accepted, job continues' })
  async approveRevision(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.bookingService.approveRevision(user, id);
  }

  @Patch(':id/reject-revision')
  @ApiOperation({ summary: 'Customer rejects technician price revision — booking is cancelled' })
  @ApiParam({ name: 'id', description: 'Booking id' })
  @ApiResponse({ status: 200, description: 'Revision rejected, booking cancelled' })
  async rejectRevision(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.bookingService.rejectRevision(user, id);
  }
}
