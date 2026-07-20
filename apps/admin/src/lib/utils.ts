import { type ClassValue, clsx } from 'clsx';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Currency ─────────────────────────────────────────────
export function formatCurrency(amount: number | string, currency = 'INR'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

// ─── Date / Time ──────────────────────────────────────────
export function formatDate(dateStr: string | Date, fmt = 'dd MMM yyyy'): string {
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  return format(date, fmt);
}

export function formatDateTime(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  return format(date, 'dd MMM yyyy, h:mm a');
}

export function formatRelative(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  return formatDistanceToNow(date, { addSuffix: true });
}

// ─── Numbers ──────────────────────────────────────────────
export function formatNumber(n: number): string {
  if (n >= 1_00_000) return `${(n / 1_00_000).toFixed(1)}L`;
  if (n >= 1_000)   return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

// ─── Text ─────────────────────────────────────────────────
export function truncate(str: string, max = 40): string {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

export function initials(name?: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

// ─── Status helpers ───────────────────────────────────────
export type BookingStatus =
  | 'DRAFT'
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'EN_ROUTE'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED';

export type VerificationStatus = 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
export type PaymentStatus = 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';

export function bookingStatusLabel(status: BookingStatus): string {
  const map: Record<BookingStatus, string> = {
    DRAFT: 'Draft',
    PENDING_PAYMENT: 'Pending Payment',
    CONFIRMED: 'Confirmed',
    ASSIGNED: 'Assigned',
    ACCEPTED: 'Accepted',
    EN_ROUTE: 'En Route',
    ARRIVED: 'Arrived',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    FAILED: 'Failed',
  };
  return map[status] ?? status;
}

export function bookingStatusVariant(status: BookingStatus): 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent' {
  if (status === 'COMPLETED') return 'success';
  if (status === 'CANCELLED' || status === 'FAILED') return 'danger';
  if (status === 'IN_PROGRESS' || status === 'EN_ROUTE' || status === 'ARRIVED') return 'info';
  if (status === 'PENDING_PAYMENT' || status === 'DRAFT') return 'warning';
  return 'accent';
}

export function verificationStatusVariant(status: VerificationStatus): 'success' | 'warning' | 'danger' | 'neutral' {
  if (status === 'VERIFIED') return 'success';
  if (status === 'REJECTED') return 'danger';
  if (status === 'UNDER_REVIEW') return 'warning';
  return 'neutral';
}

export function paymentStatusVariant(status: PaymentStatus): 'success' | 'warning' | 'danger' | 'neutral' | 'info' {
  if (status === 'CAPTURED') return 'success';
  if (status === 'FAILED') return 'danger';
  if (status === 'REFUNDED' || status === 'PARTIALLY_REFUNDED') return 'warning';
  if (status === 'AUTHORIZED') return 'info';
  return 'neutral';
}
