import { ErrorCodes } from '@fixhub/shared';
import { Injectable, NotFoundException } from '@nestjs/common';

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

  // TODO: Implement availability toggle, job management
}
