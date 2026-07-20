import { Module } from '@nestjs/common';

import { RedisModule } from '../../common/redis/redis.module';
import { AdminBookingController } from './controllers/admin-booking.controller';
import { BookingController } from './controllers/booking.controller';
import { BookingStateMachineService } from './lifecycle/booking-state-machine.service';
import { BookingMediaRepository } from './repositories/booking-media.repository';
import { BookingRepository } from './repositories/booking.repository';
import { BookingLifecycleService } from './services/booking-lifecycle.service';
import { BookingLockService } from './services/booking-lock.service';
import { BookingMediaService } from './services/booking-media.service';
import { BookingQueryCacheService } from './services/booking-query-cache.service';
import { BookingQueryService } from './services/booking-query.service';
import { BookingService } from './services/booking.service';

@Module({
  imports: [RedisModule],
  controllers: [BookingController, AdminBookingController],
  providers: [
    BookingService,
    BookingMediaService,
    BookingQueryService,
    BookingQueryCacheService,
    BookingLifecycleService,
    BookingStateMachineService,
    BookingRepository,
    BookingMediaRepository,
    BookingLockService,
  ],
  exports: [BookingService, BookingLifecycleService],
})
export class BookingModule {}
