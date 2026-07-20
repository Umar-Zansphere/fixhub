import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../common/database/prisma.service';

@Injectable()
export class TechnicianSpecializationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByTechnicianId(technicianId: string) {
    return this.prisma.technicianSpecialization.findMany({
      where: { technicianId },
      include: {
        subService: {
          select: {
            id: true,
            name: true,
            slug: true,
            basePrice: true,
            estimatedDurationMins: true,
            isActive: true,
            category: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });
  }

  async addMany(technicianId: string, subServiceIds: string[]) {
    return this.prisma.technicianSpecialization.createMany({
      data: subServiceIds.map((subServiceId) => ({
        technicianId,
        subServiceId,
      })),
      skipDuplicates: true,
    });
  }

  async removeMany(technicianId: string, subServiceIds: string[]) {
    return this.prisma.technicianSpecialization.deleteMany({
      where: {
        technicianId,
        subServiceId: { in: subServiceIds },
      },
    });
  }
}
