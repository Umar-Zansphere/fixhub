import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { Roles } from '../../../common/decorators/roles.decorator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { AuditLogService } from '../services/audit-log.service';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin/audit-logs')
@Roles(Role.ADMIN)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @ApiOperation({ summary: 'List audit logs (paginated)' })
  async getAuditLogs(@Query() query: PaginationDto) {
    return this.auditLogService.getAuditLogs(query);
  }
}
