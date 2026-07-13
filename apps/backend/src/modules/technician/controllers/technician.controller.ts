import { Controller, Get, Patch,Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation,ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/auth.interface';
import { TechnicianService } from '../services/technician.service';

@ApiTags('Technician')
@ApiBearerAuth()
@Controller('technicians')
@Roles(Role.TECHNICIAN)
export class TechnicianController {
  constructor(private readonly technicianService: TechnicianService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get technician profile' })
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.technicianService.getProfile(user.userId);
  }

  // TODO: Add endpoints for:
  // PUT /profile — Update profile
  // PATCH /availability — Toggle availability
  // GET /jobs — List assigned jobs
  // PATCH /jobs/:id/accept — Accept job
  // PATCH /jobs/:id/reject — Reject job
  // PATCH /jobs/:id/status — Update job status
}
