import { Injectable } from '@nestjs/common';
import { Prisma, VerificationStatus } from '@prisma/client';

import { PrismaService } from '../../../common/database/prisma.service';
import {
  CreateServiceAreaDto,
  ServiceAreaQueryDto,
  UpdateServiceAreaDto,
} from '../dto';

@Injectable()
export class ServiceAreaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ServiceAreaQueryDto, publicOnly = true) {
    const where: Prisma.ServiceAreaWhereInput = {
      deletedAt: null,
      ...(publicOnly ? { isActive: true } : {}),
      ...(!publicOnly && query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.city && { city: { equals: query.city, mode: 'insensitive' } }),
      ...(query.state && { state: { equals: query.state, mode: 'insensitive' } }),
      ...(query.pincode && { pincode: query.pincode }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { city: { contains: query.search, mode: 'insensitive' } },
          { state: { contains: query.search, mode: 'insensitive' } },
          { pincode: { contains: query.search } },
        ],
      }),
    };

    const sortBy = this.sortField(query.sortBy);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.serviceArea.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { [sortBy]: query.sortOrder ?? 'asc' },
        include: {
          _count: {
            select: { technicians: true },
          },
        },
      }),
      this.prisma.serviceArea.count({ where }),
    ]);

    return {
      items,
      meta: {
        page: query.page ?? 1,
        limit: query.limit ?? 10,
        total,
        totalPages: Math.ceil(total / (query.limit ?? 10)),
        hasNextPage: (query.page ?? 1) * (query.limit ?? 10) < total,
        hasPreviousPage: (query.page ?? 1) > 1,
      },
    };
  }

  findById(id: string, publicOnly = false) {
    return this.prisma.serviceArea.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(publicOnly ? { isActive: true } : {}),
      },
      include: {
        _count: {
          select: { technicians: true },
        },
      },
    });
  }

  findByPincode(pincode: string, publicOnly = false) {
    return this.prisma.serviceArea.findFirst({
      where: {
        pincode,
        deletedAt: null,
        ...(publicOnly ? { isActive: true } : {}),
      },
      include: {
        _count: {
          select: { technicians: true },
        },
      },
    });
  }

  create(dto: CreateServiceAreaDto) {
    return this.prisma.serviceArea.create({
      data: {
        name: dto.name,
        pincode: dto.pincode,
        city: dto.city,
        state: dto.state,
        isActive: dto.isActive ?? true,
      },
    });
  }

  update(id: string, dto: UpdateServiceAreaDto) {
    return this.prisma.serviceArea.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.pincode !== undefined && { pincode: dto.pincode }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.state !== undefined && { state: dto.state }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  softDelete(id: string) {
    return this.prisma.serviceArea.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }

  countActiveTechnicianCoverage(serviceAreaId: string) {
    return this.prisma.technicianServiceArea.count({
      where: {
        serviceAreaId,
        technician: {
          deletedAt: null,
          isAvailable: true,
          verificationStatus: VerificationStatus.VERIFIED,
          user: {
            isActive: true,
            deletedAt: null,
          },
        },
      },
    });
  }

  private sortField(sortBy?: string) {
    const allowed = new Set(['name', 'pincode', 'city', 'state', 'isActive', 'createdAt', 'updatedAt']);
    return allowed.has(sortBy ?? '') ? sortBy! : 'name';
  }
}
