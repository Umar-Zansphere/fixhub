import { Module } from '@nestjs/common';

import { TechnicianController } from './controllers/technician.controller';
import { TechnicianRepository } from './repositories/technician.repository';
import { TechnicianService } from './services/technician.service';

@Module({
  controllers: [TechnicianController],
  providers: [TechnicianService, TechnicianRepository],
  exports: [TechnicianService],
})
export class TechnicianModule {}
