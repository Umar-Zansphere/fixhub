import { ErrorCodes } from '@fixhub/shared';
import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../common/database/prisma.service';
import { UpdateServiceAreasDto } from '../dto';
import { TechnicianServiceAreaRepository } from '../repositories/technician-service-area.repository';
import { TechnicianService } from './technician.service';

@Injectable()
export class TechnicianServiceAreaService {
  constructor(
    private readonly technicianService: TechnicianService,
    private readonly serviceAreaRepository: TechnicianServiceAreaRepository,
    private readonly prisma: PrismaService,
  ) {}

  async listServiceAreas(userId: string) {
    const technicianId = await this.technicianService.resolveTechnicianId(userId);
    return this.serviceAreaRepository.findByTechnicianId(technicianId);
  }

  async updateServiceAreas(userId: string, dto: UpdateServiceAreasDto) {
    const technicianId = await this.technicianService.resolveTechnicianId(userId);

    // Validate all service areas exist and are active
    const validAreas = await this.prisma.serviceArea.findMany({
      where: {
        id: { in: dto.serviceAreaIds },
        isActive: true,
        deletedAt: null,
      },
      select: { id: true },
    });

    const validIds = new Set(validAreas.map((a) => a.id));
    const invalidIds = dto.serviceAreaIds.filter((id) => !validIds.has(id));

    if (invalidIds.length > 0) {
      throw new BadRequestException({
        message: `Invalid or inactive service area IDs: ${invalidIds.join(', ')}`,
        errorCode: ErrorCodes.SERVICE_AREA_NOT_FOUND,
      });
    }

    return this.serviceAreaRepository.sync(technicianId, dto.serviceAreaIds);
  }
}
