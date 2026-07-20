import { ErrorCodes } from '@fixhub/shared';
import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../common/database/prisma.service';
import { AddSpecializationsDto, RemoveSpecializationsDto } from '../dto';
import { TechnicianSpecializationRepository } from '../repositories/technician-specialization.repository';
import { TechnicianService } from './technician.service';

@Injectable()
export class TechnicianSpecializationService {
  constructor(
    private readonly technicianService: TechnicianService,
    private readonly specializationRepository: TechnicianSpecializationRepository,
    private readonly prisma: PrismaService,
  ) {}

  async listSpecializations(userId: string) {
    const technicianId = await this.technicianService.resolveTechnicianId(userId);
    return this.specializationRepository.findByTechnicianId(technicianId);
  }

  async addSpecializations(userId: string, dto: AddSpecializationsDto) {
    const technicianId = await this.technicianService.resolveTechnicianId(userId);

    // Validate all sub-services exist and are active
    const validServices = await this.prisma.subService.findMany({
      where: {
        id: { in: dto.subServiceIds },
        isActive: true,
        deletedAt: null,
      },
      select: { id: true },
    });

    const validIds = new Set(validServices.map((s) => s.id));
    const invalidIds = dto.subServiceIds.filter((id) => !validIds.has(id));

    if (invalidIds.length > 0) {
      throw new BadRequestException({
        message: `Invalid or inactive sub-service IDs: ${invalidIds.join(', ')}`,
        errorCode: ErrorCodes.SERVICE_NOT_FOUND,
      });
    }

    await this.specializationRepository.addMany(technicianId, dto.subServiceIds);
    return this.specializationRepository.findByTechnicianId(technicianId);
  }

  async removeSpecializations(userId: string, dto: RemoveSpecializationsDto) {
    const technicianId = await this.technicianService.resolveTechnicianId(userId);
    await this.specializationRepository.removeMany(technicianId, dto.subServiceIds);
    return this.specializationRepository.findByTechnicianId(technicianId);
  }
}
