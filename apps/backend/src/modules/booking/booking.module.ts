import { Module } from '@nestjs/common';

import { PrismaModule } from '../../common/database/prisma.module';
import { RedisModule } from '../../common/redis/redis.module';
import { StorageModule } from '../../common/storage/storage.module';
import { NotificationModule } from '../notification/notification.module';
import { JobOfferRepository } from '../technician/repositories/job-offer.repository';
import { TrackingModule } from '../tracking/tracking.module';
import { AdminBookingController } from './controllers/admin-booking.controller';
import { BookingController } from './controllers/booking.controller';
import { BookingStateMachineService } from './lifecycle/booking-state-machine.service';
import { BookingMediaRepository } from './repositories/booking-media.repository';
import { BookingRepository } from './repositories/booking.repository';
import { BookingDispatchService } from './services/booking-dispatch.service';
import { BookingLifecycleService } from './services/booking-lifecycle.service';
import { BookingLockService } from './services/booking-lock.service';
import { BookingMediaService } from './services/booking-media.service';
import { BookingQueryCacheService } from './services/booking-query-cache.service';
import { BookingQueryService } from './services/booking-query.service';
import { BookingService } from './services/booking.service';

@Module({
  imports: [PrismaModule, RedisModule, StorageModule, NotificationModule, TrackingModule],
  controllers: [BookingController, AdminBookingController],
  providers: [
    BookingService,
    BookingDispatchService,
    BookingMediaService,
    BookingQueryService,
    BookingQueryCacheService,
    BookingLifecycleService,
    BookingStateMachineService,
    BookingRepository,
    BookingMediaRepository,
    BookingLockService,
    // JobOfferRepository is registered here (not via TechnicianModule) to avoid
    // a circular dependency: TechnicianModule → BookingModule → TechnicianModule
    JobOfferRepository,
  ],
  exports: [BookingService, BookingLifecycleService, BookingDispatchService],
})
export class BookingModule {}
