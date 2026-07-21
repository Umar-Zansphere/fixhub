import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Public } from '../../../common/decorators/public.decorator';
import { CategoryQueryDto, ServiceQueryDto } from '../dto';
import { CatalogService } from '../services/catalog.service';

@Public()
@ApiTags('Catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('categories')
  @ApiOperation({ summary: 'List active service categories' })
  @ApiResponse({ status: 200, description: 'Categories returned' })
  listCategories(@Query() query: CategoryQueryDto) {
    return this.catalogService.listCategories(query);
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Get active service category details' })
  @ApiParam({ name: 'id', description: 'Category id' })
  @ApiResponse({ status: 200, description: 'Category returned' })
  getCategory(@Param('id') id: string) {
    return this.catalogService.getCategory(id);
  }

  @Get('services')
  @ApiOperation({ summary: 'List active sub services' })
  @ApiResponse({ status: 200, description: 'Services returned' })
  listServices(@Query() query: ServiceQueryDto) {
    return this.catalogService.listServices(query);
  }

  @Get('services/:id')
  @ApiOperation({ summary: 'Get active sub service details' })
  @ApiParam({ name: 'id', description: 'Service id' })
  @ApiResponse({ status: 200, description: 'Service returned' })
  getService(@Param('id') id: string) {
    return this.catalogService.getService(id);
  }
}
