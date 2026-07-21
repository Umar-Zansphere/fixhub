import { Injectable } from '@nestjs/common';
import { BookingStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../../../common/database/prisma.service';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { BookingQueryDto, CreateBookingMediaDto } from '../dto';
import { UpdateBookingStatusDto } from '../dto/update-booking-status.dto';

type PrismaTx = Prisma.TransactionClient;

export interface BookingQueryScope {
  customerUserId?: string;
  technicianUserId?: string;
}

export interface BookingHistoryScope extends BookingQueryScope {
  statuses?: BookingStatus[];
}

const BLOCKING_BOOKING_STATUSES = [
  BookingStatus.DRAFT,
  BookingStatus.PENDING_PAYMENT,
  BookingStatus.CONFIRMED,
  BookingStatus.ASSIGNED,
  BookingStatus.ACCEPTED,
  BookingStatus.EN_ROUTE,
  BookingStatus.ARRIVED,
  BookingStatus.IN_PROGRESS,
];

@Injectable()
export class BookingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUser(userId: string, role: string, pagination: PaginationDto) {
    const where = role === 'CUSTOMER' ? { customerId: userId } : { technician: { userId } };

    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { [pagination.sortBy || 'createdAt']: pagination.sortOrder || 'desc' },
        include: {
          subService: { include: { category: true } },
          address: true,
          technician: { include: { user: { select: { name: true, phone: true } } } },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      data,
      meta: {
        page: pagination.page || 1,
        limit: pagination.limit || 10,
        total,
        totalPages: Math.ceil(total / (pagination.limit || 10)),
        hasNextPage: (pagination.page || 1) * (pagination.limit || 10) < total,
        hasPreviousPage: (pagination.page || 1) > 1,
      },
    };
  }

  async findById(id: string) {
    return this.prisma.booking.findUnique({
      where: { id },
      include: {
        customer: { include: { user: { select: { name: true, phone: true } } } },
        technician: { include: { user: { select: { name: true, phone: true } } } },
        subService: { include: { category: true } },
        address: true,
        timeline: { orderBy: { createdAt: 'desc' } },
        payment: true,
        media: true,
        review: true,
      },
    });
  }

  async listBookings(query: BookingQueryDto, scope: BookingQueryScope = {}) {
    const where = this.buildBookingWhere(query, scope);
    const orderBy = this.bookingOrderBy(query);
    const include = this.listInclude(query.includeHistory === true);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy,
        include,
      }),
      this.prisma.booking.count({ where }),
    ]);

    return this.paginate(items, total, query);
  }

  async listBookingHistory(query: BookingQueryDto, scope: BookingHistoryScope = {}) {
    const where = this.buildBookingWhere(query, {
      customerUserId: scope.customerUserId,
      technicianUserId: scope.technicianUserId,
    });
    where.status = { in: scope.statuses ?? [BookingStatus.COMPLETED, BookingStatus.CANCELLED, BookingStatus.FAILED] };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: this.bookingOrderBy(query),
        include: this.listInclude(true),
      }),
      this.prisma.booking.count({ where }),
    ]);

    return this.paginate(items, total, query);
  }

  async findBookingDetails(id: string) {
    return this.prisma.booking.findUnique({
      where: { id },
      include: this.detailInclude(),
    });
  }

  async findByIdForLifecycle(id: string) {
    return this.prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        technician: true,
      },
    });
  }

  async findCustomerByUserId(userId: string) {
    return this.prisma.customer.findFirst({
      where: {
        userId,
        deletedAt: null,
        user: { isActive: true, deletedAt: null },
      },
      include: { user: true },
    });
  }

  async findAddressForCustomer(customerId: string, addressId: string) {
    return this.prisma.address.findFirst({
      where: {
        id: addressId,
        customerId,
        deletedAt: null,
      },
    });
  }

  async findActiveService(subServiceId: string) {
    return this.prisma.subService.findFirst({
      where: {
        id: subServiceId,
        deletedAt: null,
        isActive: true,
        category: {
          deletedAt: null,
          isActive: true,
        },
      },
      include: { category: true },
    });
  }

  async findActiveServiceAreaByPincode(pincode: string) {
    return this.prisma.serviceArea.findFirst({
      where: {
        pincode,
        deletedAt: null,
        isActive: true,
      },
    });
  }

  async countServiceCapacity(serviceAreaId: string, subServiceId: string) {
    return this.prisma.technician.count({
      where: {
        verificationStatus: 'VERIFIED',
        deletedAt: null,
        user: { isActive: true, deletedAt: null },
        serviceAreas: {
          some: { serviceAreaId },
        },
        specializations: {
          some: { subServiceId },
        },
      },
    });
  }

  async countSlotBookings(
    serviceAreaId: string,
    subServiceId: string,
    scheduledDate: Date,
    scheduledSlot: string,
    draftCreatedAfter: Date,
  ) {
    return this.prisma.booking.count({
      where: {
        address: {
          pincode: {
            in: await this.prisma.serviceArea
              .findUnique({ where: { id: serviceAreaId } })
              .then((area) => (area ? [area.pincode] : [])),
          },
        },
        subServiceId,
        scheduledDate,
        scheduledSlot,
        OR: [
          { status: { in: BLOCKING_BOOKING_STATUSES.filter((status) => status !== BookingStatus.DRAFT) } },
          {
            status: BookingStatus.DRAFT,
            createdAt: { gte: draftCreatedAfter },
          },
        ],
      },
    });
  }

  async countSlotConflicts(params: {
    addressId: string;
    scheduledDate: Date;
    scheduledSlot: string;
    draftCreatedAfter: Date;
    excludeBookingId?: string;
  }) {
    return this.prisma.booking.count({
      where: {
        addressId: params.addressId,
        scheduledDate: params.scheduledDate,
        scheduledSlot: params.scheduledSlot,
        ...(params.excludeBookingId && { id: { not: params.excludeBookingId } }),
        OR: [
          { status: { in: BLOCKING_BOOKING_STATUSES.filter((status) => status !== BookingStatus.DRAFT) } },
          {
            status: BookingStatus.DRAFT,
            createdAt: { gte: params.draftCreatedAfter },
          },
        ],
      },
    });
  }

  createBooking(
    tx: PrismaTx,
    data: {
      bookingNumber: string;
      customerId: string;
      subServiceId: string;
      addressId: string;
      scheduledDate: Date;
      scheduledSlot: string;
      description?: string;
      totalAmount: Prisma.Decimal | number;
      status: BookingStatus;
      userId: string;
    },
  ) {
    return tx.booking.create({
      data: {
        bookingNumber: data.bookingNumber,
        customerId: data.customerId,
        subServiceId: data.subServiceId,
        addressId: data.addressId,
        scheduledDate: data.scheduledDate,
        scheduledSlot: data.scheduledSlot,
        description: data.description,
        totalAmount: data.totalAmount,
        status: data.status,
        createdBy: data.userId,
        updatedBy: data.userId,
      },
      include: this.bookingInclude(),
    });
  }

  updateBookingStatus(
    tx: PrismaTx,
    bookingId: string,
    status: BookingStatus,
    userId: string,
  ) {
    return tx.booking.update({
      where: { id: bookingId },
      data: { status, updatedBy: userId },
      include: this.bookingInclude(),
    });
  }

  updateLifecycleStatus(
    tx: PrismaTx,
    id: string,
    dto: UpdateBookingStatusDto,
    actorUserId: string,
  ) {
    return tx.booking.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.status === BookingStatus.CANCELLED && {
          cancelledAt: new Date(),
          cancelReason: dto.cancelReason,
        }),
        ...(dto.status === BookingStatus.COMPLETED && { completedAt: new Date() }),
        ...(dto.status === BookingStatus.FAILED && {
          failedAt: new Date(),
          failureReason: dto.failureReason,
        }),
        updatedBy: actorUserId,
      },
      include: {
        customer: { include: { user: { select: { name: true, phone: true } } } },
        technician: { include: { user: { select: { name: true, phone: true } } } },
        subService: { include: { category: true } },
        address: true,
        timeline: { orderBy: { createdAt: 'desc' } },
        media: true,
      },
    });
  }

  assignTechnician(
    tx: PrismaTx,
    bookingId: string,
    technicianId: string,
    actorUserId: string,
  ) {
    return tx.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.ASSIGNED,
        technicianId,
        updatedBy: actorUserId,
      },
      include: {
        customer: { select: { id: true, user: { select: { name: true, phone: true } } } },
        technician: { select: { id: true, user: { select: { name: true, phone: true } } } },
        subService: { include: { category: true } },
        address: true,
      },
    });
  }

  createTimelineEntry(
    tx: PrismaTx,
    params: {
      bookingId: string;
      status: BookingStatus;
      changedByUserId: string;
      note?: string;
      latitude?: number;
      longitude?: number;
    },
  ) {
    return tx.bookingTimeline.create({
      data: {
        bookingId: params.bookingId,
        status: params.status,
        changedByUserId: params.changedByUserId,
        note: params.note,
        latitude: params.latitude,
        longitude: params.longitude,
      },
    });
  }

  createAuditLog(
    tx: PrismaTx,
    params: {
      userId: string;
      entityId: string;
      oldValue?: Prisma.InputJsonValue;
      newValue?: Prisma.InputJsonValue;
    },
  ) {
    return tx.auditLog.create({
      data: {
        userId: params.userId,
        action: 'BOOKING_STATUS_TRANSITION',
        entity: 'Booking',
        entityId: params.entityId,
        oldValue: params.oldValue ?? Prisma.JsonNull,
        newValue: params.newValue ?? Prisma.JsonNull,
      },
    });
  }

  updateDraftAndConfirm(
    tx: PrismaTx,
    bookingId: string,
    data: {
      subServiceId: string;
      addressId: string;
      scheduledDate: Date;
      scheduledSlot: string;
      description?: string;
      totalAmount: Prisma.Decimal | number;
      userId: string;
    },
  ) {
    return tx.booking.update({
      where: { id: bookingId },
      data: {
        subServiceId: data.subServiceId,
        addressId: data.addressId,
        scheduledDate: data.scheduledDate,
        scheduledSlot: data.scheduledSlot,
        description: data.description,
        totalAmount: data.totalAmount,
        status: BookingStatus.CONFIRMED,
        updatedBy: data.userId,
      },
      include: this.bookingInclude(),
    });
  }

  findDraftForCustomer(bookingId: string, customerId: string) {
    return this.prisma.booking.findFirst({
      where: {
        id: bookingId,
        customerId,
        status: BookingStatus.DRAFT,
      },
      include: this.bookingInclude(),
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

  transaction<T>(fn: (tx: PrismaTx) => Promise<T>) {
    return this.prisma.$transaction(fn);
  }

  async createReview(
    bookingId: string,
    customerId: string,
    technicianId: string,
    rating: number,
    comment?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: { bookingId, customerId, technicianId, rating, comment },
      });

      // Recompute technician aggregate rating from all reviews
      const { _avg, _count } = await tx.review.aggregate({
        where: { technicianId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await tx.technician.update({
        where: { id: technicianId },
        data: {
          rating: _avg.rating ? Math.round(_avg.rating * 100) / 100 : 0,
          totalJobs: _count.rating,
        },
      });

      return review;
    });
  }

  setPriceRevision(
    tx: PrismaTx,
    bookingId: string,
    revisedAmount: number,
    note: string | undefined,
    actorUserId: string,
  ) {
    return tx.booking.update({
      where: { id: bookingId },
      data: {
        revisedAmount,
        priceRevisionNote: note,
        status: 'PRICE_REVISION_PENDING',
        updatedBy: actorUserId,
      },
      include: this.bookingInclude(),
    });
  }

  async approveRevision(tx: PrismaTx, bookingId: string, actorUserId: string) {
    // First fetch the proposed revisedAmount, then promote it to totalAmount
    const { revisedAmount } = await tx.booking.findUniqueOrThrow({
      where: { id: bookingId },
      select: { revisedAmount: true },
    });

    return tx.booking.update({
      where: { id: bookingId },
      data: {
        totalAmount: revisedAmount!,
        status: 'IN_PROGRESS',
        customerConsentAt: new Date(),
        updatedBy: actorUserId,
      },
      include: this.bookingInclude(),
    });
  }

  findTechnicianProfileByUserId(userId: string) {
    return this.prisma.technician.findUnique({
      where: { userId },
      select: { id: true },
    });
  }

  private bookingInclude() {
    return {
      customer: { include: { user: { select: { name: true, phone: true } } } },
      subService: { include: { category: true } },
      address: true,
      media: true,
    } satisfies Prisma.BookingInclude;
  }

  private buildBookingWhere(query: BookingQueryDto, scope: BookingQueryScope): Prisma.BookingWhereInput {
    return {
      ...(scope.customerUserId && { customer: { userId: scope.customerUserId } }),
      ...(scope.technicianUserId && { technician: { userId: scope.technicianUserId } }),
      ...(query.status && { status: query.status }),
      ...(query.customerId && { customerId: query.customerId }),
      ...(query.technicianId && { technicianId: query.technicianId }),
      ...(query.subServiceId && { subServiceId: query.subServiceId }),
      ...(query.categoryId && { subService: { categoryId: query.categoryId } }),
      ...(query.pincode && { address: { pincode: query.pincode } }),
      ...((query.dateFrom || query.dateTo) && {
        scheduledDate: {
          ...(query.dateFrom && { gte: new Date(`${query.dateFrom}T00:00:00.000Z`) }),
          ...(query.dateTo && { lte: new Date(`${query.dateTo}T23:59:59.999Z`) }),
        },
      }),
      ...(query.search && {
        OR: [
          { bookingNumber: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
          { scheduledSlot: { contains: query.search, mode: 'insensitive' } },
          { customer: { user: { name: { contains: query.search, mode: 'insensitive' } } } },
          { customer: { user: { phone: { contains: query.search } } } },
          { technician: { user: { name: { contains: query.search, mode: 'insensitive' } } } },
          { technician: { user: { phone: { contains: query.search } } } },
          { subService: { name: { contains: query.search, mode: 'insensitive' } } },
          { subService: { category: { name: { contains: query.search, mode: 'insensitive' } } } },
          { address: { city: { contains: query.search, mode: 'insensitive' } } },
          { address: { pincode: { contains: query.search } } },
        ],
      }),
    };
  }

  private bookingOrderBy(query: BookingQueryDto): Prisma.BookingOrderByWithRelationInput {
    const allowed = new Set([
      'bookingNumber',
      'status',
      'scheduledDate',
      'scheduledSlot',
      'totalAmount',
      'createdAt',
      'updatedAt',
      'completedAt',
      'cancelledAt',
      'failedAt',
    ]);
    const sortBy = allowed.has(query.sortBy ?? '') ? query.sortBy! : 'createdAt';

    return { [sortBy]: query.sortOrder ?? 'desc' };
  }

  private listInclude(includeHistory: boolean): Prisma.BookingInclude {
    return {
      customer: { include: { user: { select: { id: true, name: true, phone: true } } } },
      technician: { include: { user: { select: { id: true, name: true, phone: true } } } },
      subService: {
        select: {
          id: true,
          name: true,
          basePrice: true,
          estimatedDurationMins: true,
          category: { select: { id: true, name: true, slug: true } },
        },
      },
      address: {
        select: {
          id: true,
          label: true,
          city: true,
          state: true,
          pincode: true,
        },
      },
      ...(includeHistory && {
        timeline: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      }),
    };
  }

  private detailInclude(): Prisma.BookingInclude {
    return {
      customer: { include: { user: { select: { id: true, name: true, phone: true, email: true } } } },
      technician: { include: { user: { select: { id: true, name: true, phone: true, email: true } } } },
      subService: { include: { category: true } },
      address: true,
      timeline: { orderBy: { createdAt: 'desc' } },
      media: true,
      review: true,
    };
  }

  private paginate<T>(items: T[], total: number, query: PaginationDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }
}
