import { Body,Controller, Get, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation,ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/auth.interface';
import { CustomerService } from '../services/customer.service';

@ApiTags('Customer')
@ApiBearerAuth()
@Controller('customers')
@Roles(Role.CUSTOMER)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get customer profile' })
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.customerService.getProfile(user.userId);
  }

  // TODO: Add endpoints for:
  // PUT /profile — Update profile
  // GET /addresses — List addresses
  // POST /addresses — Add address
  // PUT /addresses/:id — Update address
  // DELETE /addresses/:id — Delete address
}
