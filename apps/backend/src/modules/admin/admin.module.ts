import { Module } from '@nestjs/common';

import { AdminController } from './controllers/admin.controller';
import { AdminRepository } from './repositories/admin.repository';
import { AdminService } from './services/admin.service';
import { AuditLogController } from './controllers/audit-log.controller';
import { AuditLogService } from './services/audit-log.service';
import { SettingsController } from './controllers/settings.controller';
import { SettingsService } from './services/settings.service';

@Module({
  controllers: [AdminController, AuditLogController, SettingsController],
  providers: [AdminService, AdminRepository, AuditLogService, SettingsService],
  exports: [AdminService],
})
export class AdminModule {}
