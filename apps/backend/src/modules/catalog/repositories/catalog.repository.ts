import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../common/database/prisma.service';
import {
  CategoryQueryDto,
  CreateCategoryDto,
  CreateServiceDto,
  ServiceQueryDto,
  UpdateCategoryDto,
  UpdateServiceDto,
} from '../dto';

@Injectable()
export class CatalogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories(query: CategoryQueryDto, publicOnly = true) {
    const where: Prisma.CategoryWhereInput = {
      deletedAt: null,
      ...(publicOnly ? { isActive: true } : {}),
      ...(!publicOnly && query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { slug: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const sortBy = this.categorySortField(query.sortBy);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.category.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { [sortBy]: query.sortOrder ?? 'asc' },
        include: {
          subServices: {
            where: {
              deletedAt: null,
              ...(publicOnly ? { isActive: true } : {}),
            },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          },
        },
      }),
      this.prisma.category.count({ where }),
    ]);

    return this.paginate(items, total, query);
  }

  findCategoryById(id: string, publicOnly = true) {
    return this.prisma.category.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(publicOnly ? { isActive: true } : {}),
      },
      include: {
        subServices: {
          where: {
            deletedAt: null,
            ...(publicOnly ? { isActive: true } : {}),
          },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
      },
    });
  }

  findCategoryBySlug(slug: string) {
    return this.prisma.category.findFirst({
      where: { slug, deletedAt: null },
    });
  }

  createCategory(dto: CreateCategoryDto, actorUserId: string) {
    return this.prisma.category.create({
      data: {
        name: dto.name,
        slug: dto.slug!,
        iconUrl: dto.iconUrl,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
        createdBy: actorUserId,
        updatedBy: actorUserId,
      },
    });
  }

  updateCategory(id: string, dto: UpdateCategoryDto, actorUserId: string) {
    return this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.iconUrl !== undefined && { iconUrl: dto.iconUrl }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        updatedBy: actorUserId,
      },
    });
  }

  softDeleteCategory(id: string, actorUserId: string) {
    return this.prisma.category.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
        updatedBy: actorUserId,
        subServices: {
          updateMany: {
            where: { deletedAt: null },
            data: {
              deletedAt: new Date(),
              isActive: false,
              updatedBy: actorUserId,
            },
          },
        },
      },
    });
  }

  async listServices(query: ServiceQueryDto, publicOnly = true) {
    const categoryWhere: Prisma.CategoryWhereInput = {
      ...(publicOnly ? { isActive: true, deletedAt: null } : {}),
      ...(query.categorySlug && { slug: query.categorySlug, deletedAt: null }),
    };

    const where: Prisma.SubServiceWhereInput = {
      deletedAt: null,
      ...(publicOnly ? { isActive: true } : {}),
      ...(Object.keys(categoryWhere).length ? { category: categoryWhere } : {}),
      ...(!publicOnly && query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { slug: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
          { category: { name: { contains: query.search, mode: 'insensitive' } } },
        ],
      }),
    };

    const sortBy = this.serviceSortField(query.sortBy);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.subService.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { [sortBy]: query.sortOrder ?? 'asc' },
        include: { category: true },
      }),
      this.prisma.subService.count({ where }),
    ]);

    return this.paginate(items, total, query);
  }

  findServiceById(id: string, publicOnly = true) {
    return this.prisma.subService.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(publicOnly ? { isActive: true, category: { isActive: true, deletedAt: null } } : {}),
      },
      include: { category: true },
    });
  }

  findServiceBySlug(slug: string) {
    return this.prisma.subService.findFirst({
      where: { slug, deletedAt: null },
    });
  }

  createService(dto: CreateServiceDto, actorUserId: string) {
    return this.prisma.subService.create({
      data: {
        categoryId: dto.categoryId,
        name: dto.name,
        slug: dto.slug!,
        description: dto.description,
        basePrice: dto.basePrice,
        estimatedDurationMins: dto.estimatedDurationMins,
        iconUrl: dto.iconUrl,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
        createdBy: actorUserId,
        updatedBy: actorUserId,
      },
      include: { category: true },
    });
  }

  updateService(id: string, dto: UpdateServiceDto, actorUserId: string) {
    return this.prisma.subService.update({
      where: { id },
      data: {
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.basePrice !== undefined && { basePrice: dto.basePrice }),
        ...(dto.estimatedDurationMins !== undefined && {
          estimatedDurationMins: dto.estimatedDurationMins,
        }),
        ...(dto.iconUrl !== undefined && { iconUrl: dto.iconUrl }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        updatedBy: actorUserId,
      },
      include: { category: true },
    });
  }

  softDeleteService(id: string, actorUserId: string) {
    return this.prisma.subService.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
        updatedBy: actorUserId,
      },
      include: { category: true },
    });
  }

  private paginate<T>(items: T[], total: number, query: CategoryQueryDto | ServiceQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  private categorySortField(sortBy?: string) {
    const allowed = new Set(['name', 'slug', 'sortOrder', 'isActive', 'createdAt', 'updatedAt']);
    return allowed.has(sortBy ?? '') ? sortBy! : 'sortOrder';
  }

  private serviceSortField(sortBy?: string) {
    const allowed = new Set([
      'name',
      'slug',
      'basePrice',
      'estimatedDurationMins',
      'sortOrder',
      'isActive',
      'createdAt',
      'updatedAt',
    ]);
    return allowed.has(sortBy ?? '') ? sortBy! : 'sortOrder';
  }
}
