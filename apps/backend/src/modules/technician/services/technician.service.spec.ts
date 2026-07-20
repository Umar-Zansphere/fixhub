import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { VerificationStatus } from '@prisma/client';

import { TechnicianRepository } from '../repositories/technician.repository';
import { TechnicianService } from './technician.service';

describe('TechnicianService', () => {
  let service: TechnicianService;
  let repository: jest.Mocked<TechnicianRepository>;

  const userId = 'user-uuid-1';
  const technicianId = 'tech-uuid-1';

  const technicianProfile = {
    id: technicianId,
    userId,
    profilePictureUrl: null,
    isAvailable: false,
    verificationStatus: VerificationStatus.VERIFIED,
    rating: 4.5,
    totalJobs: 12,
    latitude: null,
    longitude: null,
    lastLocationAt: null,
    user: { id: userId, phone: '+919876543210', name: 'Ramesh', email: null, role: 'TECHNICIAN' },
    serviceAreas: [],
    specializations: [],
    documents: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TechnicianService,
        {
          provide: TechnicianRepository,
          useValue: {
            findByUserId: jest.fn(),
            findTechnicianIdByUserId: jest.fn(),
            updateProfile: jest.fn(),
            updateAvailability: jest.fn(),
            updateLocation: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(TechnicianService);
    repository = module.get(TechnicianRepository);
  });

  describe('getProfile', () => {
    it('returns the technician profile', async () => {
      repository.findByUserId.mockResolvedValue(technicianProfile as any);

      const result = await service.getProfile(userId);

      expect(result.id).toBe(technicianId);
      expect(repository.findByUserId).toHaveBeenCalledWith(userId);
    });

    it('throws NotFoundException when technician does not exist', async () => {
      repository.findByUserId.mockResolvedValue(null);

      await expect(service.getProfile(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('updates name and email via the repository', async () => {
      repository.findTechnicianIdByUserId.mockResolvedValue({
        id: technicianId,
        verificationStatus: VerificationStatus.VERIFIED,
      });
      repository.updateProfile.mockResolvedValue(technicianProfile as any);

      const dto = { name: 'Ramesh Updated', email: 'ramesh@example.com' };
      const result = await service.updateProfile(userId, dto);

      expect(result).toBeDefined();
      expect(repository.updateProfile).toHaveBeenCalledWith(userId, expect.objectContaining({
        name: 'Ramesh Updated',
        email: 'ramesh@example.com',
      }));
    });

    it('throws when technician not found', async () => {
      repository.findTechnicianIdByUserId.mockResolvedValue(null);

      await expect(service.updateProfile(userId, { name: 'Test' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateAvailability', () => {
    it('allows verified technician to go available', async () => {
      repository.findTechnicianIdByUserId.mockResolvedValue({
        id: technicianId,
        verificationStatus: VerificationStatus.VERIFIED,
      });
      repository.updateAvailability.mockResolvedValue({ ...technicianProfile, isAvailable: true } as any);

      const result = await service.updateAvailability(userId, { isAvailable: true });

      expect(result.isAvailable).toBe(true);
    });

    it('rejects unverified technician from going available', async () => {
      repository.findTechnicianIdByUserId.mockResolvedValue({
        id: technicianId,
        verificationStatus: VerificationStatus.PENDING,
      });

      await expect(
        service.updateAvailability(userId, { isAvailable: true }),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows unverified technician to go unavailable', async () => {
      repository.findTechnicianIdByUserId.mockResolvedValue({
        id: technicianId,
        verificationStatus: VerificationStatus.PENDING,
      });
      repository.updateAvailability.mockResolvedValue({ ...technicianProfile, isAvailable: false } as any);

      const result = await service.updateAvailability(userId, { isAvailable: false });

      expect(result.isAvailable).toBe(false);
    });
  });

  describe('updateLocation', () => {
    it('updates GPS coordinates', async () => {
      repository.findTechnicianIdByUserId.mockResolvedValue({
        id: technicianId,
        verificationStatus: VerificationStatus.VERIFIED,
      });
      repository.updateLocation.mockResolvedValue({
        id: technicianId,
        latitude: 13.08,
        longitude: 80.27,
        lastLocationAt: new Date(),
      } as any);

      const result = await service.updateLocation(userId, { latitude: 13.08, longitude: 80.27 });

      expect(result.latitude).toBe(13.08);
      expect(repository.updateLocation).toHaveBeenCalledWith(userId, 13.08, 80.27);
    });
  });

  describe('resolveTechnicianId', () => {
    it('returns the technician ID', async () => {
      repository.findTechnicianIdByUserId.mockResolvedValue({
        id: technicianId,
        verificationStatus: VerificationStatus.VERIFIED,
      });

      const result = await service.resolveTechnicianId(userId);

      expect(result).toBe(technicianId);
    });

    it('throws when technician not found', async () => {
      repository.findTechnicianIdByUserId.mockResolvedValue(null);

      await expect(service.resolveTechnicianId(userId)).rejects.toThrow(NotFoundException);
    });
  });
});
