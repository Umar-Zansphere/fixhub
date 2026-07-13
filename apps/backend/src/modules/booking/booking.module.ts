import { Module } from '@nestjs/common';

import { BookingController } from './controllers/booking.controller';
import { BookingRepository } from './repositories/booking.repository';
import { BookingService } from './services/booking.service';

@Module({
  controllers: [BookingController],
  providers: [BookingService, BookingRepository],
  exports: [BookingService],
})
export class BookingModule {}
