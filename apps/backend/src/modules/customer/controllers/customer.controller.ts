import { Body, Controller, Get, Put, Post, Delete, Param } from '@nestjs/common';
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

  @Put('profile')
  @ApiOperation({ summary: 'Update customer profile' })
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
  ) {
    return this.customerService.updateProfile(user.userId, body);
  }

  @Get('addresses')
  @ApiOperation({ summary: 'Get customer addresses' })
  async getAddresses(@CurrentUser() user: AuthenticatedUser) {
    return this.customerService.getAddresses(user.userId);
  }

  @Post('addresses')
  @ApiOperation({ summary: 'Add a new address' })
  async addAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Body() data: any,
  ) {
    return this.customerService.addAddress(user.userId, data);
  }

  @Put('addresses/:id')
  @ApiOperation({ summary: 'Update an address' })
  async updateAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.customerService.updateAddress(user.userId, id, data);
  }

  @Delete('addresses/:id')
  @ApiOperation({ summary: 'Delete an address' })
  async deleteAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.customerService.deleteAddress(user.userId, id);
  }
}
