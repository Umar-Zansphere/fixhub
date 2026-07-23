'use client';

import * as React from 'react';
import Link from 'next/link';
import { useBooking, useAssignTechnician, useUpdateNotes, useCancelBooking } from '@/lib/api/queries/use-bookings';
import { useTechnicians } from '@/lib/api/queries/use-technicians';
import { bookingStatusLabel, bookingStatusVariant, formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import type { BookingStatus, BookingTimeline } from '@/lib/types';
import { Avatar, Badge, Button, Card, CardContent, CardHeader, CardTitle, Skeleton, Dialog, Select } from '@/components/ui';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle, Clock, MapPin, Phone, User } from 'lucide-react';

function TimelineItem({ entry, isLast }: { entry: BookingTimeline; isLast: boolean }) {
  const variant = bookingStatusVariant(entry.status as BookingStatus);
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold
          ${variant === 'success' ? 'bg-green-100 text-green-700' :
            variant === 'danger' ? 'bg-red-100 text-red-700' :
            variant === 'info' ? 'bg-blue-100 text-blue-700' :
            variant === 'warning' ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-600'}`}>
          <CheckCircle className="h-3.5 w-3.5" />
        </div>
        {!isLast && <div className="flex-1 w-px bg-[#E5E7EB] my-1" />}
      </div>
      <div className="pb-4">
        <div className="flex items-center gap-2">
          <Badge variant={variant}>{bookingStatusLabel(entry.status as BookingStatus)}</Badge>
        </div>
        {entry.note && <p className="mt-1 text-xs text-[#6B7280]">{entry.note}</p>}
        <p className="mt-0.5 text-[11px] text-[#9CA3AF]">{formatDateTime(entry.createdAt)}</p>
      </div>
    </div>
  );
}

function AssignTechnicianDialog({
  open,
  onClose,
  bookingId,
}: {
  open: boolean;
  onClose: () => void;
  bookingId: string;
}) {
  const { data: techData, isLoading: isLoadingTechs } = useTechnicians({ limit: 100 });
  const assignMutation = useAssignTechnician();
  const [selectedTech, setSelectedTech] = React.useState('');

  React.useEffect(() => {
    if (open) setSelectedTech('');
  }, [open]);

  const handleAssign = () => {
    if (!selectedTech) return toast.error('Please select a technician');
    assignMutation.mutate(
      { bookingId, technicianId: selectedTech },
      {
        onSuccess: () => {
          toast.success('Technician assigned successfully');
          onClose();
        },
        onError: () => toast.error('Failed to assign technician'),
      }
    );
  };

  const options = (techData?.items ?? [])
    .filter((t) => (t.user?.isActive ?? true) && t.verificationStatus === 'VERIFIED')
    .map((t) => ({
      label: `${t.user?.name || 'Unknown'} (${t.user?.phone})`,
      value: t.id,
    }));

  return (
    <Dialog open={open} onClose={onClose} title="Assign Technician">
      <div className="space-y-4">
        {isLoadingTechs ? (
          <p className="text-sm text-[#6B7280]">Loading technicians...</p>
        ) : options.length === 0 ? (
          <p className="text-sm text-[#EF4444]">No approved/active technicians available.</p>
        ) : (
          <Select
            label="Select Technician"
            placeholder="Choose a technician..."
            options={options}
            value={selectedTech}
            onChange={(e) => setSelectedTech(e.target.value)}
          />
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleAssign}
            loading={assignMutation.isPending}
            disabled={!selectedTech}
          >
            Confirm
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const { data: booking, isLoading } = useBooking(resolvedParams.id);
  const [assignDialogOpen, setAssignDialogOpen] = React.useState(false);
  const [notes, setNotes] = React.useState('');
  const updateNotesMutation = useUpdateNotes();
  const cancelBookingMutation = useCancelBooking();

  React.useEffect(() => {
    if (booking?.notes) {
      setNotes(booking.notes);
    }
  }, [booking?.notes]);

  const handleSaveNotes = () => {
    if (!booking) return;
    updateNotesMutation.mutate(
      { bookingId: booking.id, notes },
      {
        onSuccess: () => toast.success('Notes saved successfully'),
        onError: () => toast.error('Failed to save notes'),
      }
    );
  };

  const handleCancelBooking = () => {
    if (!booking) return;
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    cancelBookingMutation.mutate(
      { bookingId: booking.id, reason: 'Cancelled by admin' },
      {
        onSuccess: () => toast.success('Booking cancelled successfully'),
        onError: () => toast.error('Failed to cancel booking'),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!booking) return <div className="text-sm text-[#9CA3AF]">Booking not found.</div>;

  const status = booking.status as BookingStatus;

  return (
    <div className="space-y-5 fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/bookings">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-bold text-[#111827]">{booking.bookingNumber}</h1>
            <Badge variant={bookingStatusVariant(status)}>{bookingStatusLabel(status)}</Badge>
          </div>
          <p className="text-sm text-[#6B7280]">Created {formatDateTime(booking.createdAt)}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left column — details */}
        <div className="space-y-4 lg:col-span-2">
          {/* Service Info */}
          <Card>
            <CardHeader><CardTitle>Service Details</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Service', value: booking.subService?.name ?? '—' },
                  { label: 'Category', value: booking.subService?.category?.name ?? '—' },
                  { label: 'Scheduled Date', value: formatDate(booking.scheduledDate) },
                  { label: 'Time Slot', value: booking.scheduledSlot },
                  { label: 'Amount', value: formatCurrency(booking.totalAmount) },
                  { label: 'Description', value: booking.description ?? 'No description' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[11px] text-[#9CA3AF] uppercase tracking-wide">{label}</p>
                    <p className="mt-0.5 text-sm font-medium text-[#111827]">{value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Customer */}
          <Card>
            <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar name={booking.customer?.user?.name} size="lg" />
                <div>
                  <p className="font-semibold text-[#111827]">{booking.customer?.user?.name ?? '—'}</p>
                  <p className="text-sm text-[#6B7280]">{booking.customer?.user?.phone}</p>
                  {booking.customer?.user?.email && (
                    <p className="text-sm text-[#6B7280]">{booking.customer.user.email}</p>
                  )}
                </div>
              </div>
              {booking.address && (
                <div className="mt-4 flex gap-2 rounded-lg bg-[#F8F8F7] p-3">
                  <MapPin className="h-4 w-4 flex-shrink-0 text-[#9CA3AF] mt-0.5" />
                  <div className="text-sm text-[#374151]">
                    <span className="font-medium">{booking.address.label}</span> · {booking.address.line1}
                    {booking.address.line2 && `, ${booking.address.line2}`}
                    {booking.address.landmark && ` (Near ${booking.address.landmark})`}
                    <br />
                    {booking.address.city}, {booking.address.state} — {booking.address.pincode}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Technician */}
          <Card>
            <CardHeader>
              <CardTitle>Technician</CardTitle>
              <Button variant="secondary" size="sm" onClick={() => setAssignDialogOpen(true)}>Reassign</Button>
            </CardHeader>
            <CardContent>
              {booking.technician ? (
                <div className="flex items-center gap-3">
                  <Avatar name={booking.technician.user?.name} src={booking.technician.profilePictureUrl} size="lg" />
                  <div>
                    <p className="font-semibold text-[#111827]">{booking.technician.user?.name}</p>
                    <p className="text-sm text-[#6B7280]">{booking.technician.user?.phone}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant={booking.technician.isAvailable ? 'success' : 'neutral'}>
                        {booking.technician.isAvailable ? 'Available' : 'Busy'}
                      </Badge>
                      <span className="text-xs text-[#9CA3AF]">
                        ★ {Number(booking.technician.rating).toFixed(1)} · {booking.technician.totalJobs} jobs
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-lg bg-[#FFFBEB] px-4 py-3">
                  <span className="text-sm text-[#92400E]">No technician assigned</span>
                  <Button size="sm" onClick={() => setAssignDialogOpen(true)}>Assign Technician</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment */}
          {booking.payment && (
            <Card>
              <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Amount', value: formatCurrency(booking.payment.amount) },
                    { label: 'Method', value: booking.payment.method ?? '—' },
                    { label: 'Status', value: <Badge variant={booking.payment.status === 'CAPTURED' ? 'success' : 'warning'}>{booking.payment.status}</Badge> },
                    { label: 'Gateway ID', value: booking.payment.razorpayPaymentId ?? '—' },
                    { label: 'Order ID', value: booking.payment.razorpayOrderId ?? '—' },
                    { label: 'Paid At', value: booking.payment.paidAt ? formatDateTime(booking.payment.paidAt) : '—' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[11px] text-[#9CA3AF] uppercase tracking-wide">{label}</p>
                      <div className="mt-0.5 text-sm font-medium text-[#111827]">{value}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column — timeline */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Status Timeline</CardTitle></CardHeader>
            <CardContent className="pt-2">
              {booking.timeline && booking.timeline.length > 0 ? (
                <div>
                  {booking.timeline.map((entry, i) => (
                    <TimelineItem
                      key={entry.id}
                      entry={entry}
                      isLast={i === booking.timeline!.length - 1}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#9CA3AF]">No timeline entries yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Admin Notes */}
          <Card>
            <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
            <CardContent>
              <textarea
                className="w-full resize-none rounded-lg border border-[#E5E7EB] bg-[#F8F8F7] px-3 py-2 text-sm text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#6F7F5F33]"
                rows={4}
                placeholder="Add internal notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <Button 
                size="sm" 
                className="mt-2 w-full" 
                variant="secondary"
                onClick={handleSaveNotes}
                loading={updateNotesMutation.isPending}
              >
                Save Notes
              </Button>
            </CardContent>
          </Card>

          {/* Actions */}
          {status !== 'COMPLETED' && status !== 'CANCELLED' && (
            <Card>
              <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="secondary" 
                  className="w-full" 
                  size="sm"
                  onClick={handleCancelBooking}
                  loading={cancelBookingMutation.isPending}
                >
                  Cancel Booking
                </Button>
                {booking.payment?.status === 'CAPTURED' && (
                  <Button variant="danger" className="w-full" size="sm" disabled>Process Refund</Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <AssignTechnicianDialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        bookingId={resolvedParams.id}
      />
    </div>
  );
}
