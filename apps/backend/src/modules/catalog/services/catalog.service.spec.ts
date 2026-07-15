import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { CatalogRepository } from '../repositories/catalog.repository';
import { CatalogCacheService } from './catalog-cache.service';
import { CatalogService } from './catalog.service';

describe('CatalogService', () => {
  let service: CatalogService;
  let repository: jest.Mocked<CatalogRepository>;
  let cacheService: jest.Mocked<CatalogCacheService>;

  const category = {
    id: 'category-uuid-1',
    name: 'Electrical',
    slug: 'electrical',
    iconUrl: null,
    isActive: true,
    sortOrder: 0,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin-uuid-1',
    updatedBy: 'admin-uuid-1',
  };

  const serviceItem = {
    id: 'service-uuid-1',
    categoryId: category.id,
    name: 'Fan Repair',
    slug: 'fan-repair',
    description: null,
    basePrice: 499,
    estimatedDurationMins: 60,
    iconUrl: null,
    isActive: true,
    sortOrder: 0,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin-uuid-1',
    updatedBy: 'admin-uuid-1',
    category,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogService,
        {
          provide: CatalogRepository,
          useValue: {
            listCategories: jest.fn(),
            findCategoryById: jest.fn(),
            findCategoryBySlug: jest.fn(),
            createCategory: jest.fn(),
            updateCategory: jest.fn(),
            softDeleteCategory: jest.fn(),
            listServices: jest.fn(),
            findServiceById: jest.fn(),
            findServiceBySlug: jest.fn(),
            createService: jest.fn(),
            updateService: jest.fn(),
            softDeleteService: jest.fn(),
          },
        },
        {
          provide: CatalogCacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            invalidate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(CatalogService);
    repository = module.get(CatalogRepository);
    cacheService = module.get(CatalogCacheService);
  });

  it('returns cached categories when available', async () => {
    const cached = { items: [category], meta: { total: 1 } };
    cacheService.get.mockResolvedValue(cached);

    const result = await service.listCategories({} as any);

    expect(result).toBe(cached);
    expect(repository.listCategories).not.toHaveBeenCalled();
  });

  it('loads and caches public categories on cache miss', async () => {
    const result = { items: [category], meta: { total: 1 } };
    cacheService.get.mockResolvedValue(null);
    repository.listCategories.mockResolvedValue(result as any);

    await expect(service.listCategories({} as any)).resolves.toEqual(result);

    expect(repository.listCategories).toHaveBeenCalledWith({}, true);
    expect(cacheService.set).toHaveBeenCalledWith(expect.stringContaining('categories:'), result);
  });

  it('throws when a public category is not found', async () => {
    cacheService.get.mockResolvedValue(null);
    repository.findCategoryById.mockResolvedValue(null);

    await expect(service.getCategory('missing')).rejects.toThrow(NotFoundException);
  });

  it('creates category with generated slug and invalidates cache', async () => {
    repository.findCategoryBySlug.mockResolvedValue(null);
    repository.createCategory.mockResolvedValue(category as any);

    const result = await service.createCategory({ name: 'Electrical Work' }, 'admin-uuid-1');

    expect(result).toBe(category);
    expect(repository.createCategory).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'electrical-work' }),
      'admin-uuid-1',
    );
    expect(cacheService.invalidate).toHaveBeenCalled();
  });

  it('rejects duplicate category slugs', async () => {
    repository.findCategoryBySlug.mockResolvedValue(category as any);

    await expect(service.createCategory({ name: 'Electrical' }, 'admin-uuid-1')).rejects.toThrow(
      ConflictException,
    );
  });

  it('creates a service when category exists and slug is available', async () => {
    repository.findCategoryById.mockResolvedValue(category as any);
    repository.findServiceBySlug.mockResolvedValue(null);
    repository.createService.mockResolvedValue(serviceItem as any);

    const result = await service.createService(
      {
        categoryId: category.id,
        name: 'Fan Repair',
        basePrice: 499,
        estimatedDurationMins: 60,
      },
      'admin-uuid-1',
    );

    expect(result).toBe(serviceItem);
    expect(repository.createService).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'fan-repair' }),
      'admin-uuid-1',
    );
    expect(cacheService.invalidate).toHaveBeenCalled();
  });

  it('throws when creating a service for a missing category', async () => {
    repository.findCategoryById.mockResolvedValue(null);

    await expect(
      service.createService(
        {
          categoryId: 'missing',
          name: 'Fan Repair',
          basePrice: 499,
          estimatedDurationMins: 60,
        },
        'admin-uuid-1',
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('soft deletes a service and invalidates cache', async () => {
    repository.findServiceById.mockResolvedValue(serviceItem as any);
    repository.softDeleteService.mockResolvedValue(serviceItem as any);

    const result = await service.deleteService(serviceItem.id, 'admin-uuid-1');

    expect(result.message).toBe('Service deleted successfully');
    expect(repository.softDeleteService).toHaveBeenCalledWith(serviceItem.id, 'admin-uuid-1');
    expect(cacheService.invalidate).toHaveBeenCalled();
  });
});
