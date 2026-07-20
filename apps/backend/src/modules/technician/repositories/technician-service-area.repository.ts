import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../common/database/prisma.service';

@Injectable()
export class TechnicianServiceAreaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByTechnicianId(technicianId: string) {
    return this.prisma.technicianServiceArea.findMany({
      where: { technicianId },
      include: {
        serviceArea: {
          select: {
            id: true,
            name: true,
            pincode: true,
            city: true,
            state: true,
            isActive: true,
          },
        },
      },
    });
  }

  async sync(technicianId: string, serviceAreaIds: string[]) {
    return this.prisma.$transaction(async (tx) => {
      // Remove all existing service areas
      await tx.technicianServiceArea.deleteMany({
        where: { technicianId },
      });

      // Add new service areas
      await tx.technicianServiceArea.createMany({
        data: serviceAreaIds.map((serviceAreaId) => ({
          technicianId,
          serviceAreaId,
        })),
        skipDuplicates: true,
      });

      // Return updated list
      return tx.technicianServiceArea.findMany({
        where: { technicianId },
        include: {
          serviceArea: {
            select: {
              id: true,
              name: true,
              pincode: true,
              city: true,
              state: true,
              isActive: true,
            },
          },
        },
      });
    });
  }
}
