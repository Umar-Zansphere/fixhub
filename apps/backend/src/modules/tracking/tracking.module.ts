import { Module } from '@nestjs/common';

import { PrismaModule } from '../../common/database/prisma.module';
import { TrackingGateway } from './tracking.gateway';

@Module({
  imports: [PrismaModule],
  providers: [TrackingGateway],
  exports: [TrackingGateway],
})
export class TrackingModule {}
