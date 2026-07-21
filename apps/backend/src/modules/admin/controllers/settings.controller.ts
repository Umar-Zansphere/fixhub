import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/auth.interface';
import { SettingsService } from '../services/settings.service';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin/settings')
@Roles(Role.ADMIN)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all platform settings as key-value pairs' })
  async getSettings() {
    return this.settingsService.getSettings();
  }

  @Patch()
  @ApiOperation({ summary: 'Update platform settings (upsert)' })
  async updateSettings(
    @Body() settings: Record<string, any>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.settingsService.updateSettings(settings, user.userId);
  }
}
