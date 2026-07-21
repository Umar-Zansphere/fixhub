import { ErrorCodes } from '@fixhub/shared';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  CategoryQueryDto,
  CreateCategoryDto,
  CreateServiceDto,
  ServiceQueryDto,
  UpdateCategoryDto,
  UpdateServiceDto,
} from '../dto';
import { CatalogRepository } from '../repositories/catalog.repository';
import { CatalogCacheService } from './catalog-cache.service';

@Injectable()
export class CatalogService {
  constructor(
    private readonly catalogRepository: CatalogRepository,
    private readonly cacheService: CatalogCacheService,
  ) {}

  async listCategories(query: CategoryQueryDto, isAdmin = false) {
    const cacheKey = this.cacheKey(isAdmin ? 'admin:categories' : 'categories', query);
    const cached = await this.cacheService.get(cacheKey);

    if (cached) {
      return cached;
    }

    const result = await this.catalogRepository.listCategories(query, !isAdmin);
    await this.cacheService.set(cacheKey, result);
    return result;
  }

  async getCategory(id: string, isAdmin = false) {
    const cacheKey = isAdmin ? `admin:categories:${id}` : `categories:${id}`;
    const cached = await this.cacheService.get(cacheKey);

    if (cached) {
      return cached;
    }

    const category = await this.catalogRepository.findCategoryById(id, !isAdmin);

    if (!category) {
      throw new NotFoundException({
        message: 'Category not found',
        errorCode: ErrorCodes.CATEGORY_NOT_FOUND,
      });
    }

    await this.cacheService.set(cacheKey, category);
    return category;
  }

  async listServices(query: ServiceQueryDto, isAdmin = false) {
    const cacheKey = this.cacheKey(isAdmin ? 'admin:services' : 'services', query);
    const cached = await this.cacheService.get(cacheKey);

    if (cached) {
      return cached;
    }

    const result = await this.catalogRepository.listServices(query, !isAdmin);
    await this.cacheService.set(cacheKey, result);
    return result;
  }

  async getService(id: string, isAdmin = false) {
    const cacheKey = isAdmin ? `admin:services:${id}` : `services:${id}`;
    const cached = await this.cacheService.get(cacheKey);

    if (cached) {
      return cached;
    }

    const service = await this.catalogRepository.findServiceById(id, !isAdmin);

    if (!service) {
      throw new NotFoundException({
        message: 'Service not found',
        errorCode: ErrorCodes.SERVICE_NOT_FOUND,
      });
    }

    await this.cacheService.set(cacheKey, service);
    return service;
  }

  async createCategory(dto: CreateCategoryDto, actorUserId: string) {
    const slug = this.slugify(dto.slug ?? dto.name);
    await this.ensureCategorySlugAvailable(slug);

    const category = await this.catalogRepository.createCategory(
      { ...dto, slug },
      actorUserId,
    );
    await this.cacheService.invalidate();
    return category;
  }

  async updateCategory(id: string, dto: UpdateCategoryDto, actorUserId: string) {
    const existing = await this.catalogRepository.findCategoryById(id, false);

    if (!existing) {
      throw new NotFoundException({
        message: 'Category not found',
        errorCode: ErrorCodes.CATEGORY_NOT_FOUND,
      });
    }

    const nextDto = {
      ...dto,
      ...(dto.slug !== undefined && { slug: this.slugify(dto.slug) }),
    };

    if (nextDto.slug && nextDto.slug !== existing.slug) {
      await this.ensureCategorySlugAvailable(nextDto.slug);
    }

    const updated = await this.catalogRepository.updateCategory(id, nextDto, actorUserId);
    await this.cacheService.invalidate();
    return updated;
  }

  async deleteCategory(id: string, actorUserId: string) {
    const existing = await this.catalogRepository.findCategoryById(id, false);

    if (!existing) {
      throw new NotFoundException({
        message: 'Category not found',
        errorCode: ErrorCodes.CATEGORY_NOT_FOUND,
      });
    }

    await this.catalogRepository.softDeleteCategory(id, actorUserId);
    await this.cacheService.invalidate();
    return { message: 'Category deleted successfully' };
  }

  async createService(dto: CreateServiceDto, actorUserId: string) {
    await this.ensureCategoryExists(dto.categoryId);

    const slug = this.slugify(dto.slug ?? dto.name);
    await this.ensureServiceSlugAvailable(slug);

    const service = await this.catalogRepository.createService(
      { ...dto, slug },
      actorUserId,
    );
    await this.cacheService.invalidate();
    return service;
  }

  async updateService(id: string, dto: UpdateServiceDto, actorUserId: string) {
    const existing = await this.catalogRepository.findServiceById(id, false);

    if (!existing) {
      throw new NotFoundException({
        message: 'Service not found',
        errorCode: ErrorCodes.SERVICE_NOT_FOUND,
      });
    }

    if (dto.categoryId) {
      await this.ensureCategoryExists(dto.categoryId);
    }

    const nextDto = {
      ...dto,
      ...(dto.slug !== undefined && { slug: this.slugify(dto.slug) }),
    };

    if (nextDto.slug && nextDto.slug !== existing.slug) {
      await this.ensureServiceSlugAvailable(nextDto.slug);
    }

    const updated = await this.catalogRepository.updateService(id, nextDto, actorUserId);
    await this.cacheService.invalidate();
    return updated;
  }

  async updatePricing(id: string, dto: { basePrice: number }, actorUserId: string) {
    const existing = await this.catalogRepository.findServiceById(id, false);

    if (!existing) {
      throw new NotFoundException({
        message: 'Service not found',
        errorCode: ErrorCodes.SERVICE_NOT_FOUND,
      });
    }

    const updated = await this.catalogRepository.updateService(id, { basePrice: dto.basePrice }, actorUserId);
    await this.cacheService.invalidate();
    return updated;
  }

  async deleteService(id: string, actorUserId: string) {
    const existing = await this.catalogRepository.findServiceById(id, false);

    if (!existing) {
      throw new NotFoundException({
        message: 'Service not found',
        errorCode: ErrorCodes.SERVICE_NOT_FOUND,
      });
    }

    await this.catalogRepository.softDeleteService(id, actorUserId);
    await this.cacheService.invalidate();
    return { message: 'Service deleted successfully' };
  }

  private async ensureCategoryExists(categoryId: string) {
    const category = await this.catalogRepository.findCategoryById(categoryId, false);

    if (!category) {
      throw new NotFoundException({
        message: 'Category not found',
        errorCode: ErrorCodes.CATEGORY_NOT_FOUND,
      });
    }
  }

  private async ensureCategorySlugAvailable(slug: string) {
    const existing = await this.catalogRepository.findCategoryBySlug(slug);

    if (existing) {
      throw new ConflictException({
        message: 'Category slug already exists',
        errorCode: ErrorCodes.CATEGORY_SLUG_EXISTS,
      });
    }
  }

  private async ensureServiceSlugAvailable(slug: string) {
    const existing = await this.catalogRepository.findServiceBySlug(slug);

    if (existing) {
      throw new ConflictException({
        message: 'Service slug already exists',
        errorCode: ErrorCodes.SERVICE_SLUG_EXISTS,
      });
    }
  }

  private slugify(value: string) {
    const slug = value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!slug) {
      throw new BadRequestException({
        message: 'Slug must contain at least one letter or number',
        errorCode: ErrorCodes.VALIDATION_ERROR,
      });
    }

    return slug;
  }

  private cacheKey(prefix: string, query: CategoryQueryDto | ServiceQueryDto) {
    return `${prefix}:${JSON.stringify({
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      search: query.search,
      isActive: query.isActive,
      ...('categoryId' in query && {
        categoryId: query.categoryId,
        categorySlug: query.categorySlug,
        pincode: (query as ServiceQueryDto).pincode,
      }),
    })}`;
  }
}
