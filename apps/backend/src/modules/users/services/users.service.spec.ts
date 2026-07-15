import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DevicePlatform, Role, VerificationStatus } from '@prisma/client';

import { StorageService } from '../../../common/storage/storage.service';
import { UsersRepository } from '../repositories/users.repository';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<UsersRepository>;
  let storageService: jest.Mocked<StorageService>;

  const now = new Date();
  const customerUser = {
    id: 'user-uuid-1',
    phone: '+919876543210',
    email: null,
    name: 'Customer',
    role: Role.CUSTOMER,
    isActive: true,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
    customer: {
      id: 'customer-uuid-1',
      userId: 'user-uuid-1',
      profilePictureUrl: null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    },
    technician: null,
  };

  const technicianUser = {
    ...customerUser,
    id: 'tech-user-uuid-1',
    role: Role.TECHNICIAN,
    customer: null,
    technician: {
      id: 'technician-uuid-1',
      userId: 'tech-user-uuid-1',
      profilePictureUrl: null,
      isAvailable: false,
      verificationStatus: VerificationStatus.PENDING,
      rating: 0,
      totalJobs: 0,
      latitude: null,
      longitude: null,
      lastLocationAt: null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: {
            findActiveUserById: jest.fn(),
            findAddressById: jest.fn(),
            countActiveAddresses: jest.fn(),
            listAddresses: jest.fn(),
            transaction: jest.fn((fn) => fn({})),
            updateUser: jest.fn(),
            updateTechnicianProfile: jest.fn(),
            createAuditLog: jest.fn(),
            clearDefaultAddresses: jest.fn(),
            createAddress: jest.fn(),
            updateAddress: jest.fn(),
            softDeleteAddress: jest.fn(),
            setDefaultAddress: jest.fn(),
            upsertDeviceToken: jest.fn(),
            deactivateDeviceToken: jest.fn(),
          },
        },
        {
          provide: StorageService,
          useValue: {
            generateKey: jest.fn(),
            getUploadUrl: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(UsersService);
    repository = module.get(UsersRepository);
    storageService = module.get(StorageService);
  });

  it('returns the current customer profile with account status', async () => {
    repository.findActiveUserById.mockResolvedValue(customerUser as any);

    const result = await service.getMe(customerUser.id);

    expect(result?.accountStatus).toBe('ACTIVE');
    expect(result?.profile).toEqual(
      expect.objectContaining({
        type: Role.CUSTOMER,
        id: customerUser.customer.id,
      }),
    );
  });

  it('rejects technician profile fields for non-technician users', async () => {
    repository.findActiveUserById.mockResolvedValue(customerUser as any);

    await expect(
      service.updateMe(customerUser.id, { technician: { isAvailable: true } }, {}),
    ).rejects.toThrow(ForbiddenException);
  });

  it('updates technician profile fields inside a transaction', async () => {
    repository.findActiveUserById
      .mockResolvedValueOnce(technicianUser as any)
      .mockResolvedValueOnce({
        ...technicianUser,
        technician: {
          ...technicianUser.technician,
          isAvailable: true,
        },
      } as any);
    repository.updateTechnicianProfile.mockResolvedValue({} as any);

    await service.updateMe(
      technicianUser.id,
      { technician: { isAvailable: true, latitude: 13.08, longitude: 80.27 } },
      {},
    );

    expect(repository.updateTechnicianProfile).toHaveBeenCalledWith(
      {},
      technicianUser.id,
      expect.objectContaining({
        isAvailable: true,
        latitude: 13.08,
        longitude: 80.27,
      }),
    );
    expect(repository.createAuditLog).toHaveBeenCalled();
  });

  it('creates the first address as default', async () => {
    repository.findActiveUserById.mockResolvedValue(customerUser as any);
    repository.countActiveAddresses.mockResolvedValue(0);
    repository.createAddress.mockResolvedValue({
      id: 'address-uuid-1',
      customerId: customerUser.customer.id,
      isDefault: true,
    } as any);

    await service.createAddress(
      customerUser.id,
      {
        line1: 'Street',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600001',
        latitude: 13.08,
        longitude: 80.27,
      },
      {},
    );

    expect(repository.clearDefaultAddresses).toHaveBeenCalledWith({}, customerUser.customer.id);
    expect(repository.createAddress).toHaveBeenCalledWith(
      {},
      customerUser.customer.id,
      expect.objectContaining({ isDefault: true }),
    );
  });

  it('allows only customers to list addresses', async () => {
    repository.findActiveUserById.mockResolvedValue(technicianUser as any);

    await expect(service.listAddresses(technicianUser.id, {} as any)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('throws when deleting a missing device token', async () => {
    repository.findActiveUserById.mockResolvedValue(customerUser as any);
    repository.deactivateDeviceToken.mockResolvedValue({ count: 0 } as any);

    await expect(service.deleteDeviceToken(customerUser.id, 'missing-token', {})).rejects.toThrow(
      NotFoundException,
    );
  });

  it('generates a profile image upload URL', async () => {
    repository.findActiveUserById.mockResolvedValue(customerUser as any);
    storageService.generateKey.mockReturnValue('profile-images/user-uuid-1/file.jpg');
    storageService.getUploadUrl.mockResolvedValue('https://signed-upload-url');

    const result = await service.createProfileImageUpload(
      customerUser.id,
      { fileName: 'file.jpg', contentType: 'image/jpeg' },
      {},
    );

    expect(result.uploadUrl).toBe('https://signed-upload-url');
    expect(result.key).toBe('profile-images/user-uuid-1/file.jpg');
  });

  it('registers a device token for any active role', async () => {
    repository.findActiveUserById.mockResolvedValue(technicianUser as any);
    repository.upsertDeviceToken.mockResolvedValue({ id: 'device-uuid-1' } as any);

    const result = await service.registerDeviceToken(
      technicianUser.id,
      { deviceToken: 'token', platform: DevicePlatform.ANDROID },
      {},
    );

    expect(result.deviceId).toBe('device-uuid-1');
    expect(repository.upsertDeviceToken).toHaveBeenCalledWith(
      {},
      technicianUser.id,
      'token',
      DevicePlatform.ANDROID,
    );
  });
});
