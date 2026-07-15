import { Body, Controller, Delete, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/auth.interface';
import {
  CreateCategoryDto,
  CreateServiceDto,
  UpdateCategoryDto,
  UpdateServiceDto,
} from '../dto';
import { CatalogService } from '../services/catalog.service';

@ApiTags('Admin Catalog')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminCatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Post('categories')
  @ApiOperation({ summary: 'Create service category' })
  @ApiResponse({ status: 201, description: 'Category created' })
  createCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.catalogService.createCategory(dto, user.userId);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update service category' })
  @ApiParam({ name: 'id', description: 'Category id' })
  @ApiResponse({ status: 200, description: 'Category updated' })
  updateCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.catalogService.updateCategory(id, dto, user.userId);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Soft delete service category' })
  @ApiParam({ name: 'id', description: 'Category id' })
  @ApiResponse({ status: 200, description: 'Category deleted' })
  deleteCategory(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.catalogService.deleteCategory(id, user.userId);
  }

  @Post('services')
  @ApiOperation({ summary: 'Create sub service' })
  @ApiResponse({ status: 201, description: 'Service created' })
  createService(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateServiceDto,
  ) {
    return this.catalogService.createService(dto, user.userId);
  }

  @Patch('services/:id')
  @ApiOperation({ summary: 'Update sub service' })
  @ApiParam({ name: 'id', description: 'Service id' })
  @ApiResponse({ status: 200, description: 'Service updated' })
  updateService(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.catalogService.updateService(id, dto, user.userId);
  }

  @Delete('services/:id')
  @ApiOperation({ summary: 'Soft delete sub service' })
  @ApiParam({ name: 'id', description: 'Service id' })
  @ApiResponse({ status: 200, description: 'Service deleted' })
  deleteService(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.catalogService.deleteService(id, user.userId);
  }
}
