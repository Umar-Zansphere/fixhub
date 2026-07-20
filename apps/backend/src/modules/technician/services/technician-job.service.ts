import { ErrorCodes } from '@fixhub/shared';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';

import { AuthenticatedUser } from '../../../common/interfaces/auth.interface';
import { BookingLifecycleService } from '../../booking/services/booking-lifecycle.service';
import { JobQueryDto, RejectJobDto, UpdateJobStatusDto } from '../dto';
import { TechnicianJobRepository } from '../repositories/technician-job.repository';
import { TechnicianService } from './technician.service';

/** Statuses a technician can transition TO via the job controller */
const TECHNICIAN_ALLOWED_STATUSES = new Set<string>([
  BookingStatus.ACCEPTED,
  BookingStatus.EN_ROUTE,
  BookingStatus.ARRIVED,
  BookingStatus.IN_PROGRESS,
  BookingStatus.COMPLETED,
  BookingStatus.FAILED,
]);

@Injectable()
export class TechnicianJobService {
  constructor(
    private readonly technicianService: TechnicianService,
    private readonly jobRepository: TechnicianJobRepository,
    private readonly bookingLifecycleService: BookingLifecycleService,
  ) {}

  async listJobs(userId: string, query: JobQueryDto) {
    const technicianId = await this.technicianService.resolveTechnicianId(userId);
    return this.jobRepository.listJobs(technicianId, query);
  }

  async listJobHistory(userId: string, query: JobQueryDto) {
    const technicianId = await this.technicianService.resolveTechnicianId(userId);
    return this.jobRepository.listJobHistory(technicianId, query);
  }

  async getCurrentJob(userId: string) {
    const technicianId = await this.technicianService.resolveTechnicianId(userId);
    return this.jobRepository.findCurrentJob(technicianId);
  }

  async getJobDetails(userId: string, bookingId: string) {
    const technicianId = await this.technicianService.resolveTechnicianId(userId);
    const job = await this.jobRepository.findJobById(bookingId);

    if (!job) {
      throw new NotFoundException({
        message: 'Job not found',
        errorCode: ErrorCodes.BOOKING_NOT_FOUND,
      });
    }

    if (job.technicianId !== technicianId) {
      throw new ForbiddenException({
        message: 'You do not have access to this job',
        errorCode: ErrorCodes.AUTH_FORBIDDEN,
      });
    }

    return job;
  }

  async acceptJob(user: AuthenticatedUser, bookingId: string) {
    const technicianId = await this.technicianService.resolveTechnicianId(user.userId);
    const job = await this.resolveAndVerifyJob(bookingId, technicianId);

    if (job.status !== BookingStatus.ASSIGNED) {
      throw new BadRequestException({
        message: `Job must be in ASSIGNED status to accept, current status: ${job.status}`,
        errorCode: ErrorCodes.BOOKING_INVALID_STATUS,
      });
    }

    return this.bookingLifecycleService.transition(bookingId, user, {
      status: BookingStatus.ACCEPTED,
      note: 'Technician accepted the job',
    });
  }

  async rejectJob(user: AuthenticatedUser, bookingId: string, dto: RejectJobDto) {
    const technicianId = await this.technicianService.resolveTechnicianId(user.userId);
    const job = await this.resolveAndVerifyJob(bookingId, technicianId);

    if (job.status !== BookingStatus.ASSIGNED) {
      throw new BadRequestException({
        message: `Job must be in ASSIGNED status to reject, current status: ${job.status}`,
        errorCode: ErrorCodes.BOOKING_INVALID_STATUS,
      });
    }

    // Transition back to CONFIRMED — returns to assignment pool
    return this.bookingLifecycleService.transition(bookingId, {
      // Use a system-level actor for the rejection → CONFIRMED transition
      // since ASSIGNED→CONFIRMED is an ADMIN-only transition in the state machine
      userId: user.userId,
      phone: user.phone,
      role: 'ADMIN',
    }, {
      status: BookingStatus.CONFIRMED,
      note: `Technician rejected: ${dto.reason}`,
    });
  }

  async updateJobStatus(user: AuthenticatedUser, bookingId: string, dto: UpdateJobStatusDto) {
    const technicianId = await this.technicianService.resolveTechnicianId(user.userId);
    await this.resolveAndVerifyJob(bookingId, technicianId);

    if (!TECHNICIAN_ALLOWED_STATUSES.has(dto.status)) {
      throw new BadRequestException({
        message: `Technicians cannot transition to status: ${dto.status}`,
        errorCode: ErrorCodes.BOOKING_INVALID_TRANSITION,
      });
    }

    return this.bookingLifecycleService.transition(bookingId, user, {
      status: dto.status,
      note: dto.note,
      latitude: dto.latitude,
      longitude: dto.longitude,
      failureReason: dto.failureReason,
    });
  }

  private async resolveAndVerifyJob(bookingId: string, technicianId: string) {
    const job = await this.jobRepository.findJobForAction(bookingId, technicianId);

    if (!job) {
      throw new NotFoundException({
        message: 'Job not found or not assigned to you',
        errorCode: ErrorCodes.BOOKING_NOT_FOUND,
      });
    }

    return job;
  }
}
