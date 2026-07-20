import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { Roles } from '../../../common/decorators/roles.decorator';
import { CustomerQueryDto, TechnicianQueryDto, UpdateUserStatusDto, VerifyTechnicianDto } from '../dto/admin.dto';
import { AdminService } from '../services/admin.service';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  // ── Customer Management ──────────────────────────────────

  @Get('customers')
  @ApiOperation({ summary: 'List all customers (paginated)' })
  async listCustomers(@Query() query: CustomerQueryDto) {
    return this.adminService.listCustomers(query);
  }

  @Get('customers/:id')
  @ApiOperation({ summary: 'Get customer details' })
  @ApiParam({ name: 'id', description: 'Customer id' })
  async getCustomerDetails(@Param('id') id: string) {
    return this.adminService.getCustomerDetails(id);
  }

  @Patch('customers/:userId/status')
  @ApiOperation({ summary: 'Activate/Deactivate customer' })
  @ApiParam({ name: 'userId', description: 'User id of the customer' })
  async updateCustomerStatus(
    @Param('userId') userId: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(userId, dto.isActive);
  }

  // ── Technician Management ────────────────────────────────

  @Get('technicians')
  @ApiOperation({ summary: 'List all technicians (paginated)' })
  async listTechnicians(@Query() query: TechnicianQueryDto) {
    return this.adminService.listTechnicians(query);
  }

  @Get('technicians/:id')
  @ApiOperation({ summary: 'Get technician details' })
  @ApiParam({ name: 'id', description: 'Technician id' })
  async getTechnicianDetails(@Param('id') id: string) {
    return this.adminService.getTechnicianDetails(id);
  }

  @Patch('technicians/:userId/status')
  @ApiOperation({ summary: 'Activate/Deactivate technician' })
  @ApiParam({ name: 'userId', description: 'User id of the technician' })
  async updateTechnicianStatus(
    @Param('userId') userId: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(userId, dto.isActive);
  }

  @Patch('technicians/:id/verify')
  @ApiOperation({ summary: 'Verify or Reject a technician' })
  @ApiParam({ name: 'id', description: 'Technician id (not user id)' })
  async verifyTechnician(
    @Param('id') id: string,
    @Body() dto: VerifyTechnicianDto,
  ) {
    return this.adminService.verifyTechnician(id, dto.status, dto.rejectionNote);
  }
}
