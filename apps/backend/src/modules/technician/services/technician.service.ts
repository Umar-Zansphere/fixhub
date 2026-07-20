import { ErrorCodes } from '@fixhub/shared';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { UpdateAvailabilityDto, UpdateLocationDto, UpdateProfileDto } from '../dto';
import { TechnicianRepository } from '../repositories/technician.repository';

@Injectable()
export class TechnicianService {
  constructor(private readonly technicianRepository: TechnicianRepository) {}

  async getProfile(userId: string) {
    const technician = await this.technicianRepository.findByUserId(userId);
    if (!technician) {
      throw new NotFoundException({
        message: 'Technician not found',
        errorCode: ErrorCodes.TECHNICIAN_NOT_FOUND,
      });
    }
    return technician;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    // Verify technician exists
    await this.resolveTechnicianId(userId);

    return this.technicianRepository.updateProfile(userId, {
      name: dto.name,
      email: dto.email,
      profilePictureUrl: dto.profilePictureUrl,
      latitude: dto.latitude,
      longitude: dto.longitude,
    });
  }

  async updateAvailability(userId: string, dto: UpdateAvailabilityDto) {
    const technician = await this.technicianRepository.findTechnicianIdByUserId(userId);
    if (!technician) {
      throw new NotFoundException({
        message: 'Technician not found',
        errorCode: ErrorCodes.TECHNICIAN_NOT_FOUND,
      });
    }

    // Only verified technicians can go available
    if (dto.isAvailable && technician.verificationStatus !== 'VERIFIED') {
      throw new BadRequestException({
        message: 'Technician must be verified before going available',
        errorCode: ErrorCodes.TECHNICIAN_NOT_VERIFIED,
      });
    }

    return this.technicianRepository.updateAvailability(
      userId,
      dto.isAvailable,
      dto.latitude,
      dto.longitude,
    );
  }

  async updateLocation(userId: string, dto: UpdateLocationDto) {
    await this.resolveTechnicianId(userId);
    return this.technicianRepository.updateLocation(userId, dto.latitude, dto.longitude);
  }

  /**
   * Resolve technician ID from user ID or throw 404.
   * Used by other services to get the technician record ID.
   */
  async resolveTechnicianId(userId: string): Promise<string> {
    const technician = await this.technicianRepository.findTechnicianIdByUserId(userId);
    if (!technician) {
      throw new NotFoundException({
        message: 'Technician not found',
        errorCode: ErrorCodes.TECHNICIAN_NOT_FOUND,
      });
    }
    return technician.id;
  }
}
