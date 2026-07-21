import { Injectable } from '@nestjs/common';
import { JobOfferStatus } from '@prisma/client';

import { PrismaService } from '../../../common/database/prisma.service';

const OFFER_TTL_MINUTES = 15;

@Injectable()
export class JobOfferRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Create one offer per technician for a booking (called during assignment). */
  async createOffers(bookingId: string, technicianIds: string[]) {
    const expiresAt = new Date(Date.now() + OFFER_TTL_MINUTES * 60 * 1000);
    return this.prisma.jobOffer.createMany({
      data: technicianIds.map((technicianId) => ({
        bookingId,
        technicianId,
        expiresAt,
      })),
      skipDuplicates: true,
    });
  }

  /** Active (non-expired, pending) offers for a technician. */
  async listActiveOffers(technicianId: string) {
    const now = new Date();
    return this.prisma.jobOffer.findMany({
      where: {
        technicianId,
        status: JobOfferStatus.PENDING,
        expiresAt: { gt: now },
      },
      include: {
        booking: {
          include: {
            subService: {
              include: { category: { select: { id: true, name: true } } },
            },
            address: {
              select: {
                label: true,
                line1: true,
                city: true,
                pincode: true,
                latitude: true,
                longitude: true,
              },
            },
          },
        },
      },
      orderBy: { expiresAt: 'asc' },
    });
  }

  async findOfferById(id: string) {
    return this.prisma.jobOffer.findUnique({
      where: { id },
      include: { booking: true },
    });
  }

  /** Accept this offer; expire all other PENDING offers for the same booking. */
  async acceptOffer(offerId: string, technicianId: string) {
    return this.prisma.$transaction(async (tx) => {
      const offer = await tx.jobOffer.findUniqueOrThrow({
        where: { id: offerId },
        include: { booking: true },
      });

      // Mark winner
      await tx.jobOffer.update({
        where: { id: offerId },
        data: {
          status: JobOfferStatus.ACCEPTED,
          respondedAt: new Date(),
        },
      });

      // Expire all other pending offers for this booking
      await tx.jobOffer.updateMany({
        where: {
          bookingId: offer.bookingId,
          id: { not: offerId },
          status: JobOfferStatus.PENDING,
        },
        data: { status: JobOfferStatus.EXPIRED },
      });

      // Assign technician to booking
      await tx.booking.update({
        where: { id: offer.bookingId },
        data: {
          technicianId,
          status: 'ASSIGNED',
        },
      });

      return offer;
    });
  }

  async rejectOffer(offerId: string) {
    return this.prisma.jobOffer.update({
      where: { id: offerId },
      data: {
        status: JobOfferStatus.REJECTED,
        respondedAt: new Date(),
      },
    });
  }

  /** Expire all stale PENDING offers (called by scheduler). */
  async expireStaleOffers() {
    const now = new Date();
    const result = await this.prisma.jobOffer.updateMany({
      where: {
        status: JobOfferStatus.PENDING,
        expiresAt: { lt: now },
      },
      data: { status: JobOfferStatus.EXPIRED },
    });
    return result.count;
  }

  /** Count of pending offers for a technician (for badge). */
  async countPendingOffers(technicianId: string) {
    const now = new Date();
    return this.prisma.jobOffer.count({
      where: {
        technicianId,
        status: JobOfferStatus.PENDING,
        expiresAt: { gt: now },
      },
    });
  }
}
