import { ErrorCodes } from '@fixhub/shared';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { VerificationStatus } from '@prisma/client';

import { AdminRepository } from '../repositories/admin.repository';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;
  let adminRepository: jest.Mocked<AdminRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: AdminRepository,
          useValue: {
            getDashboardStats: jest.fn(),
            listCustomers: jest.fn(),
            getCustomerDetails: jest.fn(),
            listTechnicians: jest.fn(),
            getTechnicianDetails: jest.fn(),
            updateUserStatus: jest.fn(),
            verifyTechnician: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    adminRepository = module.get(AdminRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCustomerDetails', () => {
    it('should throw NotFoundException if customer not found', async () => {
      adminRepository.getCustomerDetails.mockResolvedValue(null);

      await expect(service.getCustomerDetails('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getCustomerDetails('invalid-id')).rejects.toMatchObject({
        response: { errorCode: ErrorCodes.CUSTOMER_NOT_FOUND },
      });
    });

    it('should return customer if found', async () => {
      adminRepository.getCustomerDetails.mockResolvedValue({ id: 'valid-id' } as any);

      const result = await service.getCustomerDetails('valid-id');
      expect(result.id).toBe('valid-id');
    });
  });

  describe('verifyTechnician', () => {
    it('should update verification status', async () => {
      adminRepository.verifyTechnician.mockResolvedValue({ id: 'tech-1', verificationStatus: VerificationStatus.VERIFIED } as any);

      const result = await service.verifyTechnician('tech-1', VerificationStatus.VERIFIED);
      expect(result.verificationStatus).toBe(VerificationStatus.VERIFIED);
      expect(adminRepository.verifyTechnician).toHaveBeenCalledWith('tech-1', VerificationStatus.VERIFIED, undefined);
    });

    it('should throw NotFoundException if technician not found', async () => {
      adminRepository.verifyTechnician.mockRejectedValue({ code: 'P2025' });

      await expect(
        service.verifyTechnician('invalid-tech', VerificationStatus.REJECTED, 'Missing docs'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
