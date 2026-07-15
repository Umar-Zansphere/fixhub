import { ErrorCodes } from '@fixhub/shared';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';

import { StorageService } from '../../../common/storage/storage.service';
import {
  AddressQueryDto,
  CreateAddressDto,
  DeviceTokenDto,
  ProfileImageDto,
  UpdateAddressDto,
  UpdateUserProfileDto,
} from '../dto';
import { AuditContext, UsersRepository } from '../repositories/users.repository';

const ADDRESS_LIMIT = 10;

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly storageService: StorageService,
  ) {}

  async getMe(userId: string) {
    const user = await this.requireActiveUser(userId);
    return this.serializeUser(user);
  }

  async updateMe(userId: string, dto: UpdateUserProfileDto, context: AuditContext) {
    const user = await this.requireActiveUser(userId);

    if (dto.technician && user.role !== Role.TECHNICIAN) {
      throw new ForbiddenException({
        message: 'Technician profile fields are available only for technician users',
        errorCode: ErrorCodes.AUTH_FORBIDDEN,
      });
    }

    const updated = await this.usersRepository.transaction(async (tx) => {
      const userData: Prisma.UserUpdateInput = {};

      if (dto.name !== undefined) {
        userData.name = dto.name;
      }

      if (dto.email !== undefined) {
        userData.email = dto.email;
      }

      const updatedUser = Object.keys(userData).length
        ? await this.usersRepository.updateUser(tx, userId, userData)
        : user;

      if (dto.technician) {
        const technicianData: Prisma.TechnicianUpdateInput = {};

        if (dto.technician.isAvailable !== undefined) {
          technicianData.isAvailable = dto.technician.isAvailable;
        }

        if (dto.technician.latitude !== undefined || dto.technician.longitude !== undefined) {
          technicianData.latitude = dto.technician.latitude;
          technicianData.longitude = dto.technician.longitude;
          technicianData.lastLocationAt = new Date();
        }

        if (Object.keys(technicianData).length) {
          await this.usersRepository.updateTechnicianProfile(tx, userId, technicianData);
        }
      }

      await this.usersRepository.createAuditLog(tx, {
        userId,
        action: 'UPDATE',
        entity: 'User',
        entityId: userId,
        oldValue: this.toJson(user),
        newValue: this.toJson({ dto }),
        context,
      });

      return updatedUser;
    });

    return this.serializeUser(await this.requireActiveUser(updated.id));
  }

  async createProfileImageUpload(userId: string, dto: ProfileImageDto, context: AuditContext) {
    const user = await this.requireActiveUser(userId);
    const key = this.storageService.generateKey(`profile-images/${userId}`, dto.fileName);
    const uploadUrl = await this.storageService.getUploadUrl({
      key,
      contentType: dto.contentType,
    });

    if (dto.imageUrl && user.role !== Role.ADMIN) {
      await this.usersRepository.transaction(async (tx) => {
        const updated = await this.usersRepository.updateProfileImage(
          tx,
          userId,
          user.role,
          dto.imageUrl!,
        );

        await this.usersRepository.createAuditLog(tx, {
          userId,
          action: 'UPDATE',
          entity: user.role === Role.TECHNICIAN ? 'Technician' : 'Customer',
          entityId: updated.id,
          oldValue: this.toJson(user.role === Role.TECHNICIAN ? user.technician : user.customer),
          newValue: this.toJson({ profilePictureUrl: dto.imageUrl }),
          context,
        });
      });
    }

    return {
      key,
      uploadUrl,
      imageUrl: dto.imageUrl,
      message: dto.imageUrl
        ? 'Profile image updated successfully'
        : 'Upload URL generated successfully',
    };
  }

  async listAddresses(userId: string, query: AddressQueryDto) {
    const customer = await this.requireCustomer(userId);
    return this.usersRepository.listAddresses(customer.id, query);
  }

  async createAddress(userId: string, dto: CreateAddressDto, context: AuditContext) {
    const customer = await this.requireCustomer(userId);
    const activeAddressCount = await this.usersRepository.countActiveAddresses(customer.id);

    if (activeAddressCount >= ADDRESS_LIMIT) {
      throw new BadRequestException({
        message: `Maximum ${ADDRESS_LIMIT} active addresses are allowed`,
        errorCode: ErrorCodes.CUSTOMER_ADDRESS_LIMIT_REACHED,
      });
    }

    return this.usersRepository.transaction(async (tx) => {
      const shouldBeDefault = dto.isDefault === true || activeAddressCount === 0;

      if (shouldBeDefault) {
        await this.usersRepository.clearDefaultAddresses(tx, customer.id);
      }

      const address = await this.usersRepository.createAddress(tx, customer.id, {
        ...dto,
        isDefault: shouldBeDefault,
      });

      await this.usersRepository.createAuditLog(tx, {
        userId,
        action: 'CREATE',
        entity: 'Address',
        entityId: address.id,
        newValue: this.toJson(address),
        context,
      });

      return address;
    });
  }

  async updateAddress(
    userId: string,
    addressId: string,
    dto: UpdateAddressDto,
    context: AuditContext,
  ) {
    const customer = await this.requireCustomer(userId);
    const address = await this.requireAddress(customer.id, addressId);

    return this.usersRepository.transaction(async (tx) => {
      const updated = await this.usersRepository.updateAddress(tx, addressId, dto);

      await this.usersRepository.createAuditLog(tx, {
        userId,
        action: 'UPDATE',
        entity: 'Address',
        entityId: addressId,
        oldValue: this.toJson(address),
        newValue: this.toJson(updated),
        context,
      });

      return updated;
    });
  }

  async deleteAddress(userId: string, addressId: string, context: AuditContext) {
    const customer = await this.requireCustomer(userId);
    const address = await this.requireAddress(customer.id, addressId);

    await this.usersRepository.transaction(async (tx) => {
      const deleted = await this.usersRepository.softDeleteAddress(tx, addressId);

      await this.usersRepository.createAuditLog(tx, {
        userId,
        action: 'DELETE',
        entity: 'Address',
        entityId: addressId,
        oldValue: this.toJson(address),
        newValue: this.toJson(deleted),
        context,
      });
    });

    return { message: 'Address deleted successfully' };
  }

  async setDefaultAddress(userId: string, addressId: string, context: AuditContext) {
    const customer = await this.requireCustomer(userId);
    const address = await this.requireAddress(customer.id, addressId);

    return this.usersRepository.transaction(async (tx) => {
      await this.usersRepository.clearDefaultAddresses(tx, customer.id);
      const updated = await this.usersRepository.setDefaultAddress(tx, addressId);

      await this.usersRepository.createAuditLog(tx, {
        userId,
        action: 'UPDATE',
        entity: 'Address',
        entityId: addressId,
        oldValue: this.toJson(address),
        newValue: this.toJson(updated),
        context,
      });

      return updated;
    });
  }

  async registerDeviceToken(userId: string, dto: DeviceTokenDto, context: AuditContext) {
    await this.requireActiveUser(userId);

    const device = await this.usersRepository.transaction(async (tx) => {
      const upserted = await this.usersRepository.upsertDeviceToken(
        tx,
        userId,
        dto.deviceToken,
        dto.platform,
      );

      await this.usersRepository.createAuditLog(tx, {
        userId,
        action: 'UPSERT',
        entity: 'DeviceToken',
        entityId: upserted.id,
        newValue: this.toJson({ platform: dto.platform, isActive: true }),
        context,
      });

      return upserted;
    });

    return { message: 'Device token registered successfully', deviceId: device.id };
  }

  async deleteDeviceToken(userId: string, deviceToken: string, context: AuditContext) {
    await this.requireActiveUser(userId);

    const result = await this.usersRepository.transaction(async (tx) => {
      const updated = await this.usersRepository.deactivateDeviceToken(tx, userId, deviceToken);

      if (updated.count === 0) {
        return updated;
      }

      await this.usersRepository.createAuditLog(tx, {
        userId,
        action: 'DELETE',
        entity: 'DeviceToken',
        entityId: userId,
        oldValue: this.toJson({ token: deviceToken }),
        newValue: this.toJson({ isActive: false, affected: updated.count }),
        context,
      });

      return updated;
    });

    if (result.count === 0) {
      throw new NotFoundException({
        message: 'Device token not found',
        errorCode: ErrorCodes.DEVICE_TOKEN_INVALID,
      });
    }

    return { message: 'Device token removed successfully' };
  }

  private async requireActiveUser(userId: string) {
    const user = await this.usersRepository.findActiveUserById(userId);

    if (!user) {
      throw new UnauthorizedException({
        message: 'User not found',
        errorCode: ErrorCodes.USER_NOT_FOUND,
      });
    }

    if (!user.isActive) {
      throw new ForbiddenException({
        message: 'Account is deactivated',
        errorCode: ErrorCodes.AUTH_ACCOUNT_DEACTIVATED,
      });
    }

    return user;
  }

  private async requireCustomer(userId: string) {
    const user = await this.requireActiveUser(userId);

    if (user.role !== Role.CUSTOMER || !user.customer) {
      throw new ForbiddenException({
        message: 'Address management is available only for customer users',
        errorCode: ErrorCodes.AUTH_FORBIDDEN,
      });
    }

    return user.customer;
  }

  private async requireAddress(customerId: string, addressId: string) {
    const address = await this.usersRepository.findAddressById(customerId, addressId);

    if (!address) {
      throw new NotFoundException({
        message: 'Address not found',
        errorCode: ErrorCodes.CUSTOMER_ADDRESS_NOT_FOUND,
      });
    }

    return address;
  }

  private serializeUser(user: Awaited<ReturnType<UsersRepository['findActiveUserById']>>) {
    if (!user) {
      return user;
    }

    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      name: user.name,
      role: user.role,
      accountStatus: user.isActive ? 'ACTIVE' : 'INACTIVE',
      isActive: user.isActive,
      deletedAt: user.deletedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      ...(user.role === Role.CUSTOMER && user.customer && {
        profile: {
          type: Role.CUSTOMER,
          id: user.customer.id,
          profilePictureUrl: user.customer.profilePictureUrl,
          createdAt: user.customer.createdAt,
          updatedAt: user.customer.updatedAt,
        },
      }),
      ...(user.role === Role.TECHNICIAN && user.technician && {
        profile: {
          type: Role.TECHNICIAN,
          id: user.technician.id,
          profilePictureUrl: user.technician.profilePictureUrl,
          isAvailable: user.technician.isAvailable,
          verificationStatus: user.technician.verificationStatus,
          rating: Number(user.technician.rating),
          totalJobs: user.technician.totalJobs,
          latitude: user.technician.latitude ? Number(user.technician.latitude) : null,
          longitude: user.technician.longitude ? Number(user.technician.longitude) : null,
          lastLocationAt: user.technician.lastLocationAt,
          createdAt: user.technician.createdAt,
          updatedAt: user.technician.updatedAt,
        },
      }),
      ...(user.role === Role.ADMIN && {
        profile: {
          type: Role.ADMIN,
          id: user.id,
        },
      }),
    };
  }

  private toJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }
}
