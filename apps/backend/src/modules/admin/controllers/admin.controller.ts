import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation,ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { Roles } from '../../../common/decorators/roles.decorator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
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

  // TODO: Add endpoints for:
  // --- Technician Management ---
  // GET /technicians — List technicians (paginated)
  // GET /technicians/:id — Get technician details
  // PATCH /technicians/:id/verify — Verify technician
  // PATCH /technicians/:id/status — Activate/deactivate

  // --- Category & SubService Management ---
  // GET /categories — List categories
  // POST /categories — Create category
  // PUT /categories/:id — Update category
  // DELETE /categories/:id — Delete category
  // POST /categories/:id/sub-services — Create sub-service
  // PUT /sub-services/:id — Update sub-service

  // --- Service Area Management ---
  // GET /service-areas — List service areas
  // POST /service-areas — Create service area
  // PUT /service-areas/:id — Update service area

  // --- Booking Management ---
  // GET /bookings — List all bookings (paginated, filterable)
  // PATCH /bookings/:id/assign — Assign technician to booking

  // --- Pricing Management ---
  // PUT /sub-services/:id/pricing — Update pricing
}
