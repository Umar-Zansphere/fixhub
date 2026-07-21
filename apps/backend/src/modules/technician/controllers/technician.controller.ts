import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { AuthenticatedUser } from '../../../common/interfaces/auth.interface';
import { ProposeRevisionDto } from '../../booking/dto';
import { BookingService } from '../../booking/services/booking.service';
import {
  AddSpecializationsDto,
  CreateDocumentDto,
  EarningsQueryDto,
  JobQueryDto,
  RejectJobDto,
  RemoveSpecializationsDto,
  UpdateAvailabilityDto,
  UpdateJobStatusDto,
  UpdateLocationDto,
  UpdateProfileDto,
  UpdateServiceAreasDto,
} from '../dto';
import { TechnicianDocumentService } from '../services/technician-document.service';
import { TechnicianEarningsService } from '../services/technician-earnings.service';
import { TechnicianJobService } from '../services/technician-job.service';
import { TechnicianReviewService } from '../services/technician-review.service';
import { TechnicianServiceAreaService } from '../services/technician-service-area.service';
import { TechnicianSpecializationService } from '../services/technician-specialization.service';
import { TechnicianService } from '../services/technician.service';
import { JobOfferService } from '../services/job-offer.service';


@ApiTags('Technician')
@ApiBearerAuth()
@Controller('technicians')
@Roles(Role.TECHNICIAN)
export class TechnicianController {
  constructor(
    private readonly technicianService: TechnicianService,
    private readonly documentService: TechnicianDocumentService,
    private readonly specializationService: TechnicianSpecializationService,
    private readonly serviceAreaService: TechnicianServiceAreaService,
    private readonly jobService: TechnicianJobService,
    private readonly reviewService: TechnicianReviewService,
    private readonly earningsService: TechnicianEarningsService,
    private readonly offerService: JobOfferService,
    private readonly bookingService: BookingService,
  ) {}

  // ── Profile ──────────────────────────────────────────────

  @Get('profile')
  @ApiOperation({ summary: 'Get technician profile' })
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.technicianService.getProfile(user.userId);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update technician profile' })
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.technicianService.updateProfile(user.userId, dto);
  }

  @Patch('availability')
  @ApiOperation({ summary: 'Toggle technician availability' })
  async updateAvailability(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return this.technicianService.updateAvailability(user.userId, dto);
  }

  @Patch('location')
  @ApiOperation({ summary: 'Update technician GPS location' })
  async updateLocation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.technicianService.updateLocation(user.userId, dto);
  }

  // ── Documents ────────────────────────────────────────────

  @Get('documents')
  @ApiOperation({ summary: 'List technician documents' })
  async listDocuments(@CurrentUser() user: AuthenticatedUser) {
    return this.documentService.listDocuments(user.userId);
  }

  @Post('documents')
  @ApiOperation({ summary: 'Upload a document (returns presigned URL)' })
  @ApiResponse({ status: 201, description: 'Document created with upload URL' })
  async uploadDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDocumentDto,
  ) {
    return this.documentService.uploadDocument(user.userId, dto);
  }

  @Delete('documents/:id')
  @ApiOperation({ summary: 'Delete a document' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  async deleteDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.documentService.deleteDocument(user.userId, id);
  }

  // ── Specializations (Skills) ─────────────────────────────

  @Get('specializations')
  @ApiOperation({ summary: 'List technician specializations' })
  async listSpecializations(@CurrentUser() user: AuthenticatedUser) {
    return this.specializationService.listSpecializations(user.userId);
  }

  @Post('specializations')
  @ApiOperation({ summary: 'Add specializations (sub-services)' })
  @ApiResponse({ status: 201, description: 'Specializations added' })
  async addSpecializations(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddSpecializationsDto,
  ) {
    return this.specializationService.addSpecializations(user.userId, dto);
  }

  @Delete('specializations')
  @ApiOperation({ summary: 'Remove specializations (sub-services)' })
  async removeSpecializations(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RemoveSpecializationsDto,
  ) {
    return this.specializationService.removeSpecializations(user.userId, dto);
  }

  // ── Service Areas ────────────────────────────────────────

  @Get('service-areas')
  @ApiOperation({ summary: 'List technician service areas' })
  async listServiceAreas(@CurrentUser() user: AuthenticatedUser) {
    return this.serviceAreaService.listServiceAreas(user.userId);
  }

  @Put('service-areas')
  @ApiOperation({ summary: 'Sync technician service areas' })
  async updateServiceAreas(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateServiceAreasDto,
  ) {
    return this.serviceAreaService.updateServiceAreas(user.userId, dto);
  }

  // ── Jobs ─────────────────────────────────────────────────

  @Get('jobs')
  @ApiOperation({ summary: 'List assigned jobs' })
  async listJobs(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: JobQueryDto,
  ) {
    return this.jobService.listJobs(user.userId, query);
  }

  @Get('jobs/current')
  @ApiOperation({ summary: 'Get current active job' })
  async getCurrentJob(@CurrentUser() user: AuthenticatedUser) {
    return this.jobService.getCurrentJob(user.userId);
  }

  @Get('jobs/history')
  @ApiOperation({ summary: 'List completed, cancelled, and failed jobs' })
  async listJobHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: JobQueryDto,
  ) {
    return this.jobService.listJobHistory(user.userId, query);
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Get job details' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  async getJobDetails(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.jobService.getJobDetails(user.userId, id);
  }

  @Patch('jobs/:id/accept')
  @ApiOperation({ summary: 'Accept an assigned job' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  async acceptJob(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.jobService.acceptJob(user, id);
  }

  @Patch('jobs/:id/reject')
  @ApiOperation({ summary: 'Reject an assigned job' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  async rejectJob(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RejectJobDto,
  ) {
    return this.jobService.rejectJob(user, id, dto);
  }

  @Patch('jobs/:id/status')
  @ApiOperation({ summary: 'Update job status (EN_ROUTE, ARRIVED, IN_PROGRESS, COMPLETED, FAILED)' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  async updateJobStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateJobStatusDto,
  ) {
    return this.jobService.updateJobStatus(user, id, dto);
  }

  // ── Ratings ──────────────────────────────────────────────

  @Get('ratings')
  @ApiOperation({ summary: 'List reviews received by the technician' })
  async listRatings(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationDto,
  ) {
    return this.reviewService.listReviews(user.userId, query);
  }

  @Get('ratings/summary')
  @ApiOperation({ summary: 'Get rating summary (average, distribution)' })
  async getRatingsSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.reviewService.getRatingsSummary(user.userId);
  }

  // ── Earnings ─────────────────────────────────────────────

  @Get('earnings')
  @ApiOperation({ summary: 'Get earnings summary' })
  async getEarnings(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: EarningsQueryDto,
  ) {
    return this.earningsService.getEarningsSummary(user.userId, query);
  }

  @Get('earnings/history')
  @ApiOperation({ summary: 'List earnings history (completed bookings)' })
  async listEarningsHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: EarningsQueryDto,
  ) {
    return this.earningsService.listEarnings(user.userId, query);
  }

  // ── Job Offers (Broadcast Eligibility) ─────────────────────────────

  @Get('offers')
  @ApiOperation({ summary: 'List pending job offers (non-expired, requires response within 15 min)' })
  async listOffers(@CurrentUser() user: AuthenticatedUser) {
    return this.offerService.listOffers(user.userId);
  }

  @Get('offers/count')
  @ApiOperation({ summary: 'Count of pending job offers (for badge)' })
  async countOffers(@CurrentUser() user: AuthenticatedUser) {
    return this.offerService.countPendingOffers(user.userId);
  }

  @Patch('offers/:id/accept')
  @ApiOperation({ summary: 'Accept a job offer (technician takes the booking)' })
  @ApiParam({ name: 'id', description: 'JobOffer ID' })
  async acceptOffer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.offerService.acceptOffer(user, id);
  }

  @Patch('offers/:id/reject')
  @ApiOperation({ summary: 'Reject a job offer' })
  @ApiParam({ name: 'id', description: 'JobOffer ID' })
  async rejectOffer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RejectJobDto,
  ) {
    return this.offerService.rejectOffer(user, id, dto.reason);
  }

  // ── Price Revision (Propose) ─────────────────────────────────

  @Patch('jobs/:id/propose-revision')
  @ApiOperation({ summary: 'Technician proposes a revised price after inspection (IN_PROGRESS only)' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  async proposeRevision(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ProposeRevisionDto,
  ) {
    return this.bookingService.proposeRevision(user, id, dto);
  }
}
