import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/auth.interface';
import {
  AddressQueryDto,
  CreateAddressDto,
  DeleteDeviceTokenDto,
  DeviceTokenDto,
  ProfileImageDto,
  UpdateAddressDto,
  UpdateUserProfileDto,
} from '../dto';
import { UsersService } from '../services/users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile returned' })
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getMe(user.userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile updated' })
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserProfileDto,
    @Req() request: Request,
  ) {
    return this.usersService.updateMe(user.userId, dto, this.auditContext(request));
  }

  @Post('profile-image')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate profile image upload URL and optionally persist image URL' })
  @ApiResponse({ status: 200, description: 'Profile image upload prepared' })
  createProfileImageUpload(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ProfileImageDto,
    @Req() request: Request,
  ) {
    return this.usersService.createProfileImageUpload(
      user.userId,
      dto,
      this.auditContext(request),
    );
  }

  @Get('addresses')
  @ApiOperation({ summary: 'List customer addresses' })
  @ApiResponse({ status: 200, description: 'Customer addresses returned' })
  listAddresses(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: AddressQueryDto,
  ) {
    return this.usersService.listAddresses(user.userId, query);
  }

  @Post('addresses')
  @ApiOperation({ summary: 'Create customer address' })
  @ApiResponse({ status: 201, description: 'Address created' })
  createAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAddressDto,
    @Req() request: Request,
  ) {
    return this.usersService.createAddress(user.userId, dto, this.auditContext(request));
  }

  @Patch('addresses/:id')
  @ApiOperation({ summary: 'Update customer address' })
  @ApiParam({ name: 'id', description: 'Address id' })
  @ApiResponse({ status: 200, description: 'Address updated' })
  updateAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
    @Req() request: Request,
  ) {
    return this.usersService.updateAddress(
      user.userId,
      id,
      dto,
      this.auditContext(request),
    );
  }

  @Delete('addresses/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete customer address' })
  @ApiParam({ name: 'id', description: 'Address id' })
  @ApiResponse({ status: 200, description: 'Address deleted' })
  deleteAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() request: Request,
  ) {
    return this.usersService.deleteAddress(user.userId, id, this.auditContext(request));
  }

  @Patch('addresses/:id/default')
  @ApiOperation({ summary: 'Set customer default address' })
  @ApiParam({ name: 'id', description: 'Address id' })
  @ApiResponse({ status: 200, description: 'Default address updated' })
  setDefaultAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() request: Request,
  ) {
    return this.usersService.setDefaultAddress(user.userId, id, this.auditContext(request));
  }

  @Post('device-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register device token for push notifications' })
  @ApiResponse({ status: 200, description: 'Device token registered' })
  registerDeviceToken(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DeviceTokenDto,
    @Req() request: Request,
  ) {
    return this.usersService.registerDeviceToken(
      user.userId,
      dto,
      this.auditContext(request),
    );
  }

  @Delete('device-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove device token for current user' })
  @ApiResponse({ status: 200, description: 'Device token removed' })
  deleteDeviceToken(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DeleteDeviceTokenDto,
    @Req() request: Request,
  ) {
    return this.usersService.deleteDeviceToken(
      user.userId,
      dto.deviceToken,
      this.auditContext(request),
    );
  }

  private auditContext(request: Request) {
    return {
      ipAddress: request.ip,
      userAgent: request.get('user-agent'),
    };
  }
}
