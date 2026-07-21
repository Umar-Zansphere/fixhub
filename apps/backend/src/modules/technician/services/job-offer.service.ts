import { ErrorCodes } from '@fixhub/shared';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { AuthenticatedUser } from '../../../common/interfaces/auth.interface';
import { JobOfferRepository } from '../repositories/job-offer.repository';
import { TechnicianService } from './technician.service';

@Injectable()
export class JobOfferService {
  constructor(
    private readonly technicianService: TechnicianService,
    private readonly offerRepository: JobOfferRepository,
  ) {}

  async listOffers(userId: string) {
    const technicianId = await this.technicianService.resolveTechnicianId(userId);
    return this.offerRepository.listActiveOffers(technicianId);
  }

  async countPendingOffers(userId: string) {
    const technicianId = await this.technicianService.resolveTechnicianId(userId);
    const count = await this.offerRepository.countPendingOffers(technicianId);
    return { count };
  }

  async acceptOffer(user: AuthenticatedUser, offerId: string) {
    const technicianId = await this.technicianService.resolveTechnicianId(user.userId);
    const offer = await this.offerRepository.findOfferById(offerId);

    if (!offer) {
      throw new NotFoundException({ message: 'Offer not found', errorCode: ErrorCodes.BOOKING_NOT_FOUND });
    }

    if (offer.technicianId !== technicianId) {
      throw new ForbiddenException({ message: 'This offer is not for you', errorCode: ErrorCodes.AUTH_FORBIDDEN });
    }

    if (offer.status !== 'PENDING') {
      throw new ForbiddenException({ message: `Offer is already ${offer.status}` });
    }

    if (new Date() > offer.expiresAt) {
      throw new ForbiddenException({ message: 'This offer has expired' });
    }

    return this.offerRepository.acceptOffer(offerId, technicianId);
  }

  async rejectOffer(user: AuthenticatedUser, offerId: string, reason?: string) {
    const technicianId = await this.technicianService.resolveTechnicianId(user.userId);
    const offer = await this.offerRepository.findOfferById(offerId);

    if (!offer) {
      throw new NotFoundException({ message: 'Offer not found', errorCode: ErrorCodes.BOOKING_NOT_FOUND });
    }

    if (offer.technicianId !== technicianId) {
      throw new ForbiddenException({ message: 'This offer is not for you', errorCode: ErrorCodes.AUTH_FORBIDDEN });
    }

    return this.offerRepository.rejectOffer(offerId);
  }
}
