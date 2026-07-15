import { Injectable } from '@nestjs/common';
import { DevicePlatform, Prisma, Role } from '@prisma/client';

import { PrismaService } from '../../../common/database/prisma.service';
import { AddressQueryDto, CreateAddressDto, UpdateAddressDto } from '../dto';

type PrismaTx = Prisma.TransactionClient;

export interface AuditContext {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveUserById(userId: string) {
    return this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        customer: { where: { deletedAt: null } },
        technician: { where: { deletedAt: null } },
      },
    });
  }

  findCustomerByUserId(userId: string) {
    return this.prisma.customer.findFirst({
      where: { userId, deletedAt: null, user: { deletedAt: null } },
    });
  }

  updateUser(
    tx: PrismaTx,
    userId: string,
    data: Prisma.UserUpdateInput,
  ) {
    return tx.user.update({
      where: { id: userId },
      data,
      include: {
        customer: { where: { deletedAt: null } },
        technician: { where: { deletedAt: null } },
      },
    });
  }

  updateTechnicianProfile(
    tx: PrismaTx,
    userId: string,
    data: Prisma.TechnicianUpdateInput,
  ) {
    return tx.technician.update({
      where: { userId },
      data,
    });
  }

  updateProfileImage(
    tx: PrismaTx,
    userId: string,
    role: Role,
    imageUrl: string,
  ) {
    if (role === Role.TECHNICIAN) {
      return tx.technician.update({
        where: { userId },
        data: { profilePictureUrl: imageUrl },
      });
    }

    if (role === Role.CUSTOMER) {
      return tx.customer.update({
        where: { userId },
        data: { profilePictureUrl: imageUrl },
      });
    }

    return tx.user.update({
      where: { id: userId },
      data: {},
    });
  }

  async listAddresses(customerId: string, query: AddressQueryDto) {
    const where: Prisma.AddressWhereInput = {
      customerId,
      deletedAt: null,
      ...(query.label && { label: { equals: query.label, mode: 'insensitive' } }),
      ...(query.city && { city: { equals: query.city, mode: 'insensitive' } }),
      ...(query.state && { state: { equals: query.state, mode: 'insensitive' } }),
      ...(query.pincode && { pincode: query.pincode }),
      ...(query.isDefault !== undefined && { isDefault: query.isDefault }),
      ...(query.search && {
        OR: [
          { label: { contains: query.search, mode: 'insensitive' } },
          { line1: { contains: query.search, mode: 'insensitive' } },
          { line2: { contains: query.search, mode: 'insensitive' } },
          { landmark: { contains: query.search, mode: 'insensitive' } },
          { city: { contains: query.search, mode: 'insensitive' } },
          { state: { contains: query.search, mode: 'insensitive' } },
          { pincode: { contains: query.search } },
        ],
      }),
    };

    const sortBy = this.addressSortField(query.sortBy);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.address.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { [sortBy]: query.sortOrder ?? 'desc' },
      }),
      this.prisma.address.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page: query.page ?? 1,
        limit: query.limit ?? 10,
        totalPages: Math.ceil(total / (query.limit ?? 10)),
      },
    };
  }

  findAddressById(customerId: string, addressId: string) {
    return this.prisma.address.findFirst({
      where: { id: addressId, customerId, deletedAt: null },
    });
  }

  createAddress(
    tx: PrismaTx,
    customerId: string,
    dto: CreateAddressDto,
  ) {
    return tx.address.create({
      data: {
        customerId,
        label: dto.label ?? 'Home',
        line1: dto.line1,
        line2: dto.line2,
        landmark: dto.landmark,
        city: dto.city,
        state: dto.state,
        pincode: dto.pincode,
        latitude: dto.latitude,
        longitude: dto.longitude,
        isDefault: dto.isDefault ?? false,
      },
    });
  }

  updateAddress(
    tx: PrismaTx,
    addressId: string,
    dto: UpdateAddressDto,
  ) {
    return tx.address.update({
      where: { id: addressId },
      data: {
        ...(dto.label !== undefined && { label: dto.label }),
        ...(dto.line1 !== undefined && { line1: dto.line1 }),
        ...(dto.line2 !== undefined && { line2: dto.line2 }),
        ...(dto.landmark !== undefined && { landmark: dto.landmark }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.state !== undefined && { state: dto.state }),
        ...(dto.pincode !== undefined && { pincode: dto.pincode }),
        ...(dto.latitude !== undefined && { latitude: dto.latitude }),
        ...(dto.longitude !== undefined && { longitude: dto.longitude }),
      },
    });
  }

  softDeleteAddress(tx: PrismaTx, addressId: string) {
    return tx.address.update({
      where: { id: addressId },
      data: { deletedAt: new Date(), isDefault: false },
    });
  }

  clearDefaultAddresses(tx: PrismaTx, customerId: string) {
    return tx.address.updateMany({
      where: { customerId, deletedAt: null, isDefault: true },
      data: { isDefault: false },
    });
  }

  setDefaultAddress(tx: PrismaTx, addressId: string) {
    return tx.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    });
  }

  countActiveAddresses(customerId: string) {
    return this.prisma.address.count({
      where: { customerId, deletedAt: null },
    });
  }

  upsertDeviceToken(
    tx: PrismaTx,
    userId: string,
    token: string,
    platform: DevicePlatform,
  ) {
    return tx.deviceToken.upsert({
      where: { token },
      create: { userId, token, platform, isActive: true },
      update: { userId, platform, isActive: true },
    });
  }

  deactivateDeviceToken(tx: PrismaTx, userId: string, token: string) {
    return tx.deviceToken.updateMany({
      where: { userId, token },
      data: { isActive: false },
    });
  }

  createAuditLog(
    tx: PrismaTx,
    params: {
      userId: string;
      action: string;
      entity: string;
      entityId: string;
      oldValue?: Prisma.InputJsonValue;
      newValue?: Prisma.InputJsonValue;
      context?: AuditContext;
    },
  ) {
    return tx.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        oldValue: params.oldValue ?? Prisma.JsonNull,
        newValue: params.newValue ?? Prisma.JsonNull,
        ipAddress: params.context?.ipAddress,
        userAgent: params.context?.userAgent,
      },
    });
  }

  transaction<T>(fn: (tx: PrismaTx) => Promise<T>) {
    return this.prisma.$transaction(fn);
  }

  private addressSortField(sortBy?: string) {
    const allowed = new Set(['createdAt', 'updatedAt', 'label', 'city', 'state', 'pincode', 'isDefault']);
    return allowed.has(sortBy ?? '') ? sortBy! : 'createdAt';
  }
}
