import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ServiceAreaRepository } from '../repositories/service-area.repository';
import { ServiceAreaCacheService } from './service-area-cache.service';
import { ServiceAreaService } from './service-area.service';

describe('ServiceAreaService', () => {
  let service: ServiceAreaService;
  let repository: jest.Mocked<ServiceAreaRepository>;
  let cacheService: jest.Mocked<ServiceAreaCacheService>;

  const area = {
    id: 'service-area-uuid-1',
    name: 'Kolathur',
    pincode: '600099',
    city: 'Chennai',
    state: 'Tamil Nadu',
    isActive: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { technicians: 2 },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceAreaService,
        {
          provide: ServiceAreaRepository,
          useValue: {
            list: jest.fn(),
            findById: jest.fn(),
            findByPincode: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            countActiveTechnicianCoverage: jest.fn(),
          },
        },
        {
          provide: ServiceAreaCacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            invalidate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ServiceAreaService);
    repository = module.get(ServiceAreaRepository);
    cacheService = module.get(ServiceAreaCacheService);
  });

  it('returns cached service areas when available', async () => {
    const cached = { items: [area], meta: { total: 1 } };
    cacheService.get.mockResolvedValue(cached);

    const result = await service.list({} as any);

    expect(result).toBe(cached);
    expect(repository.list).not.toHaveBeenCalled();
  });

  it('loads and caches active public service areas on cache miss', async () => {
    const result = { items: [area], meta: { total: 1 } };
    cacheService.get.mockResolvedValue(null);
    repository.list.mockResolvedValue(result as any);

    await expect(service.list({ city: 'Chennai' } as any)).resolves.toEqual(result);

    expect(repository.list).toHaveBeenCalledWith({ city: 'Chennai' }, true);
    expect(cacheService.set).toHaveBeenCalledWith(expect.stringContaining('list:'), result);
  });

  it('validates a serviceable pincode with active technician coverage', async () => {
    cacheService.get.mockResolvedValue(null);
    repository.findByPincode.mockResolvedValue(area as any);
    repository.countActiveTechnicianCoverage.mockResolvedValue(2);

    const result = (await service.validate({ pincode: '600099' })) as any;

    expect(result.isCovered).toBe(true);
    expect(result.isServiceable).toBe(true);
    expect(result.activeTechnicianCount).toBe(2);
    expect(result.reason).toBe('SERVICEABLE');
    expect(cacheService.set).toHaveBeenCalledWith('validate:600099', result);
  });

  it('returns not covered validation for an unknown pincode', async () => {
    cacheService.get.mockResolvedValue(null);
    repository.findByPincode.mockResolvedValue(null);

    const result = (await service.validate({ pincode: '600500' })) as any;

    expect(result.isCovered).toBe(false);
    expect(result.isServiceable).toBe(false);
    expect(result.reason).toBe('PINCODE_NOT_COVERED');
    expect(result.serviceArea).toBeNull();
  });

  it('returns no technician coverage when area is active but no verified available technicians exist', async () => {
    cacheService.get.mockResolvedValue(null);
    repository.findByPincode.mockResolvedValue(area as any);
    repository.countActiveTechnicianCoverage.mockResolvedValue(0);

    const result = (await service.validate({ pincode: '600099' })) as any;

    expect(result.isCovered).toBe(true);
    expect(result.isServiceable).toBe(false);
    expect(result.reason).toBe('NO_ACTIVE_TECHNICIAN_COVERAGE');
  });

  it('rejects duplicate pincode on create', async () => {
    repository.findByPincode.mockResolvedValue(area as any);

    await expect(
      service.create({
        name: 'Kolathur',
        pincode: '600099',
        city: 'Chennai',
        state: 'Tamil Nadu',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('creates service area and invalidates cache', async () => {
    repository.findByPincode.mockResolvedValue(null);
    repository.create.mockResolvedValue(area as any);

    const result = await service.create({
      name: 'Kolathur',
      pincode: '600099',
      city: 'Chennai',
      state: 'Tamil Nadu',
    });

    expect(result).toBe(area);
    expect(cacheService.invalidate).toHaveBeenCalled();
  });

  it('throws when updating a missing service area', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.update('missing', { city: 'Chennai' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('soft deletes service area and invalidates cache', async () => {
    repository.findById.mockResolvedValue(area as any);
    repository.softDelete.mockResolvedValue({ ...area, isActive: false, deletedAt: new Date() } as any);

    const result = await service.delete(area.id);

    expect(result.message).toBe('Service area deleted successfully');
    expect(repository.softDelete).toHaveBeenCalledWith(area.id);
    expect(cacheService.invalidate).toHaveBeenCalled();
  });
});
