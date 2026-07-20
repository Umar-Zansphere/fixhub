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
        specializations: {
          include: {
            subService: {
              include: { category: { select: { id: true, name: true, slug: true } } },
            },
          },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findTechnicianIdByUserId(userId: string) {
    const technician = await this.prisma.technician.findUnique({
      where: { userId },
      select: { id: true, verificationStatus: true },
    });
    return technician;
  }

  async updateProfile(userId: string, data: {
    name?: string;
    email?: string;
    profilePictureUrl?: string;
    latitude?: number;
    longitude?: number;
  }) {
    return this.prisma.$transaction(async (tx) => {
      // Update User-level fields
      if (data.name !== undefined || data.email !== undefined) {
        await tx.user.update({
          where: { id: userId },
          data: {
            ...(data.name !== undefined && { name: data.name }),
            ...(data.email !== undefined && { email: data.email }),
          },
        });
      }

      // Update Technician-level fields
      const technicianUpdate: Record<string, unknown> = {};
      if (data.profilePictureUrl !== undefined) technicianUpdate.profilePictureUrl = data.profilePictureUrl;
      if (data.latitude !== undefined) technicianUpdate.latitude = data.latitude;
      if (data.longitude !== undefined) technicianUpdate.longitude = data.longitude;
      if (data.latitude !== undefined || data.longitude !== undefined) {
        technicianUpdate.lastLocationAt = new Date();
      }

      if (Object.keys(technicianUpdate).length > 0) {
        await tx.technician.update({
          where: { userId },
          data: technicianUpdate,
        });
      }

      // Return full profile
      return tx.technician.findUnique({
        where: { userId },
        include: {
          user: { select: { id: true, phone: true, name: true, email: true, role: true } },
          serviceAreas: { include: { serviceArea: true } },
          specializations: {
            include: {
              subService: {
                include: { category: { select: { id: true, name: true, slug: true } } },
              },
            },
          },
          documents: { orderBy: { createdAt: 'desc' } },
        },
      });
    });
  }

  async updateAvailability(userId: string, isAvailable: boolean, latitude?: number, longitude?: number) {
    return this.prisma.technician.update({
      where: { userId },
      data: {
        isAvailable,
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
        ...((latitude !== undefined || longitude !== undefined) && { lastLocationAt: new Date() }),
      },
      include: {
        user: { select: { id: true, phone: true, name: true, email: true, role: true } },
      },
    });
  }

  async updateLocation(userId: string, latitude: number, longitude: number) {
    return this.prisma.technician.update({
      where: { userId },
      data: {
        latitude,
        longitude,
        lastLocationAt: new Date(),
      },
      select: {
        id: true,
        latitude: true,
        longitude: true,
        lastLocationAt: true,
      },
    });
  }
}
