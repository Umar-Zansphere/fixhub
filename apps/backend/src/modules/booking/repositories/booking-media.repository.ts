import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../common/database/prisma.service';
import { CreateBookingMediaDto } from '../dto';

type PrismaTx = Prisma.TransactionClient;

@Injectable()
export class BookingMediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  findBookingForMedia(bookingId: string) {
    return this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        technician: true,
      },
    });
  }

  findMediaById(mediaId: string) {
    return this.prisma.bookingMedia.findUnique({
      where: { id: mediaId },
      include: {
        booking: {
          include: {
            customer: true,
            technician: true,
          },
        },
      },
    });
  }

  createMedia(
    tx: PrismaTx,
    bookingId: string,
    userId: string,
    s3Key: string,
    dto: CreateBookingMediaDto,
  ) {
    return tx.bookingMedia.create({
      data: {
        bookingId,
        uploadedBy: userId,
        s3Key,
        url: dto.url!,
        type: dto.type ?? 'IMAGE',
        uploadPhase: dto.uploadPhase ?? 'BEFORE_SERVICE',
      },
    });
  }

  deleteMedia(tx: PrismaTx, mediaId: string) {
    return tx.bookingMedia.delete({
      where: { id: mediaId },
    });
  }

  transaction<T>(fn: (tx: PrismaTx) => Promise<T>) {
    return this.prisma.$transaction(fn);
  }
}
