import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../common/database/prisma.service';

@Injectable()
export class TechnicianRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string) {
    return this.prisma.technician.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, phone: true, name: true, email: true, role: true } },
        serviceAreas: { include: { serviceArea: true } },
        documents: true,
      },
    });
  }

  // TODO: Implement update, availability toggle, find by service area
}
