import { Body, Controller, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { AuthenticatedUser } from '../../../common/interfaces/auth.interface';
import {
  NotificationPreferencesDto,
  SendNotificationDto,
  UpsertTemplateDto,
} from '../dto';
import { NotificationService } from '../services/notification.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for current user' })
  async list(@CurrentUser() user: AuthenticatedUser, @Query() pagination: PaginationDto) {
    return this.notificationService.listByUser(user.userId, pagination);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.notificationService.markAsRead(id, user.userId);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationService.markAllAsRead(user.userId);
  }

  @Post('send')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Queue a multi-channel notification' })
  @ApiResponse({ status: 201, description: 'Notification queued' })
  async send(@Body() dto: SendNotificationDto) {
    return this.notificationService.send(dto);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get current user notification preferences' })
  async getPreferences(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationService.getPreferences(user.userId);
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Update current user notification preferences' })
  async updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: NotificationPreferencesDto,
  ) {
    return this.notificationService.updatePreferences(user.userId, dto);
  }

  @Put('templates/:key')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create or update notification template' })
  @ApiParam({ name: 'key', description: 'Template key' })
  async upsertTemplate(@Param('key') key: string, @Body() dto: UpsertTemplateDto) {
    return this.notificationService.upsertTemplate({ ...dto.template, key });
  }

  @Get('templates/:key')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get notification template' })
  @ApiParam({ name: 'key', description: 'Template key' })
  async getTemplate(@Param('key') key: string) {
    return this.notificationService.getTemplate(key);
  }
}
