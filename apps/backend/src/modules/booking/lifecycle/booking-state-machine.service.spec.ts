import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { BookingStatus, Role } from '@prisma/client';

import { BookingStateMachineService } from './booking-state-machine.service';

describe('BookingStateMachineService', () => {
  let service: BookingStateMachineService;

  const baseBooking = {
    id: 'booking-uuid-1',
    status: BookingStatus.ASSIGNED,
    customerId: 'customer-uuid-1',
    technicianId: 'technician-uuid-1',
    customer: { userId: 'customer-user-uuid-1' },
    technician: { userId: 'technician-user-uuid-1' },
  } as any;

  beforeEach(() => {
    service = new BookingStateMachineService();
  });

  it('allows assigned booking to be accepted by the assigned technician', () => {
    const transition = service.validate({
      booking: baseBooking,
      actor: {
        userId: 'technician-user-uuid-1',
        phone: '+919876543210',
        role: Role.TECHNICIAN,
      },
      dto: { status: BookingStatus.ACCEPTED },
    });

    expect(transition.from).toBe(BookingStatus.ASSIGNED);
    expect(transition.to).toBe(BookingStatus.ACCEPTED);
  });

  it('rejects transitions outside the state graph', () => {
    expect(() =>
      service.validate({
        booking: { ...baseBooking, status: BookingStatus.CONFIRMED },
        actor: { userId: 'admin-uuid-1', phone: '+919876543210', role: Role.ADMIN },
        dto: { status: BookingStatus.COMPLETED },
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects technician transition when booking belongs to another technician', () => {
    expect(() =>
      service.validate({
        booking: baseBooking,
        actor: {
          userId: 'other-technician-user-uuid',
          phone: '+919876543210',
          role: Role.TECHNICIAN,
        },
        dto: { status: BookingStatus.ACCEPTED },
      }),
    ).toThrow(ForbiddenException);
  });

  it('requires cancellation reason for cancellation transitions', () => {
    expect(() =>
      service.validate({
        booking: {
          ...baseBooking,
          status: BookingStatus.CONFIRMED,
          technicianId: null,
          technician: null,
        },
        actor: {
          userId: 'customer-user-uuid-1',
          phone: '+919876543210',
          role: Role.CUSTOMER,
        },
        dto: { status: BookingStatus.CANCELLED },
      }),
    ).toThrow(BadRequestException);
  });

  it('requires failure reason for failed transitions', () => {
    expect(() =>
      service.validate({
        booking: { ...baseBooking, status: BookingStatus.IN_PROGRESS },
        actor: {
          userId: 'technician-user-uuid-1',
          phone: '+919876543210',
          role: Role.TECHNICIAN,
        },
        dto: { status: BookingStatus.FAILED },
      }),
    ).toThrow(BadRequestException);
  });

  it('returns allowed next statuses for a status', () => {
    expect(service.getAllowedTransitions(BookingStatus.IN_PROGRESS)).toEqual([
      BookingStatus.COMPLETED,
      BookingStatus.FAILED,
    ]);
  });
});
