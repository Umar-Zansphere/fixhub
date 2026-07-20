'use client';

import * as React from 'react';
import Link from 'next/link';

import type { Booking, BookingStatus } from '@/lib/types';
import { bookingStatusLabel, bookingStatusVariant, formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { Avatar, Badge, Button, Drawer, Separator } from '@/components/ui';
import { ExternalLink, MapPin } from 'lucide-react';

interface BookingDrawerProps {
  booking: Booking | null;
  open: boolean;
  onClose: () => void;
}

export function BookingDrawer({ booking, open, onClose }: BookingDrawerProps) {
  if (!booking) return null;
  const status = booking.status as BookingStatus;

  return (
    <Drawer open={open} onClose={onClose} title={booking.bookingNumber} width="w-[480px]">
      <div className="p-5 space-y-5">
        {/* Status */}
        <div className="flex items-center justify-between">
          <Badge variant={bookingStatusVariant(status)}>{bookingStatusLabel(status)}</Badge>
          <Link href={`/bookings/${booking.id}`}>
            <Button variant="ghost" size="sm" rightIcon={<ExternalLink className="h-3.5 w-3.5" />}>
              Full Details
            </Button>
          </Link>
        </div>

        <Separator />

        {/* Service */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">Service</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Service', value: booking.subService?.name ?? '—' },
              { label: 'Category', value: booking.subService?.category?.name ?? '—' },
              { label: 'Date', value: formatDate(booking.scheduledDate) },
              { label: 'Slot', value: booking.scheduledSlot },
              { label: 'Amount', value: formatCurrency(booking.totalAmount) },
              { label: 'Created', value: formatDate(booking.createdAt) },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] text-[#9CA3AF] uppercase">{label}</p>
                <p className="text-sm font-medium text-[#111827]">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Customer */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">Customer</h3>
          <div className="flex items-center gap-3">
            <Avatar name={booking.customer?.user?.name} size="md" />
            <div>
              <p className="text-sm font-semibold text-[#111827]">{booking.customer?.user?.name ?? '—'}</p>
              <p className="text-xs text-[#6B7280]">{booking.customer?.user?.phone}</p>
            </div>
          </div>
          {booking.address && (
            <div className="flex gap-2 rounded-lg bg-[#F8F8F7] px-3 py-2.5">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-[#9CA3AF] mt-0.5" />
              <p className="text-xs text-[#374151]">
                {booking.address.line1}, {booking.address.city} — {booking.address.pincode}
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Technician */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">Technician</h3>
          {booking.technician ? (
            <div className="flex items-center gap-3">
              <Avatar name={booking.technician.user?.name} size="md" />
              <div>
                <p className="text-sm font-semibold text-[#111827]">{booking.technician.user?.name}</p>
                <p className="text-xs text-[#6B7280]">★ {Number(booking.technician.rating).toFixed(1)} · {booking.technician.totalJobs} jobs</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#9CA3AF]">Not assigned yet</p>
          )}
        </div>

        {/* Description */}
        {booking.description && (
          <>
            <Separator />
            <div>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">Description</h3>
              <p className="text-sm text-[#374151]">{booking.description}</p>
            </div>
          </>
        )}
      </div>
    </Drawer>
  );
}
