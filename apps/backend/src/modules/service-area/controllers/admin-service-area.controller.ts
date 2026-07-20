import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { Roles } from '../../../common/decorators/roles.decorator';
import { CreateServiceAreaDto, ServiceAreaQueryDto, UpdateServiceAreaDto } from '../dto';
import { ServiceAreaService } from '../services/service-area.service';

@ApiTags('Admin Service Areas')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin/service-areas')
export class AdminServiceAreaController {
  constructor(private readonly serviceAreaService: ServiceAreaService) {}

  @Get()
  @ApiOperation({ summary: 'List all service areas for admin' })
  list(@Query() query: ServiceAreaQueryDto) {
    return this.serviceAreaService.list({ ...query, publicOnly: false } as any);
  }

  @Post()
  @ApiOperation({ summary: 'Create service area' })
  @ApiResponse({ status: 201, description: 'Service area created' })
  create(@Body() dto: CreateServiceAreaDto) {
    return this.serviceAreaService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update service area' })
  @ApiParam({ name: 'id', description: 'Service area id' })
  @ApiResponse({ status: 200, description: 'Service area updated' })
  update(@Param('id') id: string, @Body() dto: UpdateServiceAreaDto) {
    return this.serviceAreaService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete service area' })
  @ApiParam({ name: 'id', description: 'Service area id' })
  @ApiResponse({ status: 200, description: 'Service area deleted' })
  delete(@Param('id') id: string) {
    return this.serviceAreaService.delete(id);
  }
}
