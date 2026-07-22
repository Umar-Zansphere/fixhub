import { Module } from '@nestjs/common';

import { StorageModule } from '../../common/storage/storage.module';
import { BookingModule } from '../booking/booking.module';
import { TrackingModule } from '../tracking/tracking.module';
import { TechnicianController } from './controllers/technician.controller';
import { TechnicianDocumentRepository } from './repositories/technician-document.repository';
import { TechnicianEarningsRepository } from './repositories/technician-earnings.repository';
import { TechnicianJobRepository } from './repositories/technician-job.repository';
import { TechnicianReviewRepository } from './repositories/technician-review.repository';
import { TechnicianServiceAreaRepository } from './repositories/technician-service-area.repository';
import { TechnicianSpecializationRepository } from './repositories/technician-specialization.repository';
import { TechnicianRepository } from './repositories/technician.repository';
import { JobOfferRepository } from './repositories/job-offer.repository';
import { TechnicianDocumentService } from './services/technician-document.service';
import { TechnicianEarningsService } from './services/technician-earnings.service';
import { TechnicianJobService } from './services/technician-job.service';
import { TechnicianReviewService } from './services/technician-review.service';
import { TechnicianServiceAreaService } from './services/technician-service-area.service';
import { TechnicianSpecializationService } from './services/technician-specialization.service';
import { TechnicianService } from './services/technician.service';
import { JobOfferService } from './services/job-offer.service';

@Module({
  imports: [StorageModule, BookingModule, TrackingModule],
  controllers: [TechnicianController],
  providers: [
    // Services
    TechnicianService,
    TechnicianDocumentService,
    TechnicianSpecializationService,
    TechnicianServiceAreaService,
    TechnicianJobService,
    TechnicianReviewService,
    TechnicianEarningsService,
    JobOfferService,
    // Repositories
    TechnicianRepository,
    TechnicianDocumentRepository,
    TechnicianSpecializationRepository,
    TechnicianServiceAreaRepository,
    TechnicianJobRepository,
    TechnicianReviewRepository,
    TechnicianEarningsRepository,
    JobOfferRepository,
  ],
  exports: [TechnicianService],
})
export class TechnicianModule {}
