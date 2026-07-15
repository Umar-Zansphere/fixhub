import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Public } from '../../../common/decorators/public.decorator';
import { ServiceAreaQueryDto, ValidateServiceAreaDto } from '../dto';
import { ServiceAreaService } from '../services/service-area.service';

@Public()
@ApiTags('Service Areas')
@Controller('service-areas')
export class ServiceAreaController {
  constructor(private readonly serviceAreaService: ServiceAreaService) {}

  @Get()
  @ApiOperation({ summary: 'List active service areas' })
  @ApiResponse({ status: 200, description: 'Service areas returned' })
  list(@Query() query: ServiceAreaQueryDto) {
    return this.serviceAreaService.list(query);
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate whether a pincode is serviceable' })
  @ApiResponse({ status: 201, description: 'Pincode coverage validation returned' })
  validate(@Body() dto: ValidateServiceAreaDto) {
    return this.serviceAreaService.validate(dto);
  }
}
