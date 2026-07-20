// ============================================================
// FixHub Admin — Complete Type Definitions
// Aligned with backend Prisma schema & API responses
// ============================================================

export type Role = 'CUSTOMER' | 'TECHNICIAN' | 'ADMIN';

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

export type PaymentStatus =
  | 'PENDING'
  | 'AUTHORIZED'
  | 'CAPTURED'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export type PaymentMethod = 'UPI' | 'CARD' | 'NETBANKING' | 'WALLET' | 'COD';

export type PaymentTransactionType = 'AUTHORIZE' | 'CAPTURE' | 'REFUND' | 'FAILURE';

export type VerificationStatus = 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';

export type DocumentType =
  | 'AADHAAR'
  | 'PAN'
  | 'DRIVING_LICENSE'
  | 'CERTIFICATE'
  | 'OTHER';

export type MediaType = 'IMAGE' | 'VIDEO' | 'DOCUMENT';

export type MediaUploadPhase = 'BEFORE_SERVICE' | 'DURING_SERVICE' | 'AFTER_SERVICE';

export type NotificationType =
  | 'BOOKING_UPDATE'
  | 'PAYMENT_UPDATE'
  | 'ASSIGNMENT'
  | 'REVIEW'
  | 'SYSTEM'
  | 'PROMOTIONAL';

export type CancellationActor = 'CUSTOMER' | 'TECHNICIAN' | 'ADMIN' | 'SYSTEM';

// ─── User ─────────────────────────────────────────────────
export interface User {
  id: string;
  phone: string;
  email?: string | null;
  name?: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

// ─── Customer ─────────────────────────────────────────────
export interface Customer {
  id: string;
  userId: string;
  profilePictureUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  user: Pick<User, 'id' | 'name' | 'email' | 'phone' | 'isActive' | 'createdAt'>;
  addresses?: Address[];
  bookings?: Booking[];
  _count?: { bookings: number; addresses: number };
}

// ─── Address ──────────────────────────────────────────────
export interface Address {
  id: string;
  customerId: string;
  label: string;
  line1: string;
  line2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  createdAt: string;
}

// ─── ServiceArea ──────────────────────────────────────────
export interface ServiceArea {
  id: string;
  name: string;
  pincode: string;
  city: string;
  state: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Category ─────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  slug: string;
  iconUrl?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  subServices?: SubService[];
  _count?: { subServices: number };
}

// ─── SubService ───────────────────────────────────────────
export interface SubService {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description?: string | null;
  basePrice: number | string;
  estimatedDurationMins: number;
  iconUrl?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  category?: Pick<Category, 'id' | 'name' | 'slug'>;
}

// ─── Technician ───────────────────────────────────────────
export interface TechnicianDocument {
  id: string;
  technicianId: string;
  documentType: DocumentType;
  url: string;
  s3Key: string;
  isVerified: boolean;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  rejectionNote?: string | null;
  createdAt: string;
}

export interface Technician {
  id: string;
  userId: string;
  profilePictureUrl?: string | null;
  isAvailable: boolean;
  verificationStatus: VerificationStatus;
  rating: number | string;
  totalJobs: number;
  latitude?: number | null;
  longitude?: number | null;
  lastLocationAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user: Pick<User, 'id' | 'name' | 'email' | 'phone' | 'isActive' | 'createdAt'>;
  serviceAreas?: { serviceArea: ServiceArea }[];
  specializations?: { subService: SubService & { category: Category } }[];
  documents?: TechnicianDocument[];
  _count?: { bookings: number; reviews: number };
}

// ─── Booking ──────────────────────────────────────────────
export interface BookingTimeline {
  id: string;
  bookingId: string;
  status: BookingStatus;
  changedByUserId: string;
  note?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
}

export interface BookingMedia {
  id: string;
  bookingId: string;
  url: string;
  s3Key: string;
  type: MediaType;
  uploadPhase: MediaUploadPhase;
  uploadedBy: string;
  createdAt: string;
}

export interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  technicianId: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  customerId: string;
  technicianId?: string | null;
  subServiceId: string;
  addressId: string;
  status: BookingStatus;
  scheduledDate: string;
  scheduledSlot: string;
  description?: string | null;
  totalAmount: number | string;
  notes?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  cancelledBy?: CancellationActor | null;
  cancelReason?: string | null;
  failedAt?: string | null;
  failureReason?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  technician?: Technician | null;
  subService?: SubService & { category?: Category };
  address?: Address;
  timeline?: BookingTimeline[];
  media?: BookingMedia[];
  payment?: Payment | null;
  review?: Review | null;
}

// ─── Payment ──────────────────────────────────────────────
export interface PaymentTransaction {
  id: string;
  paymentId: string;
  type: PaymentTransactionType;
  razorpayEventId?: string | null;
  amount: number | string;
  status: string;
  gatewayResponse?: Record<string, unknown> | null;
  createdAt: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  razorpaySignature?: string | null;
  amount: number | string;
  currency: string;
  status: PaymentStatus;
  method?: PaymentMethod | null;
  failureReason?: string | null;
  paidAt?: string | null;
  refundedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  booking?: Pick<Booking, 'id' | 'bookingNumber' | 'totalAmount'>;
  transactions?: PaymentTransaction[];
}

// ─── Notification ─────────────────────────────────────────
export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

// ─── Audit Log ────────────────────────────────────────────
export interface AuditLog {
  id: string;
  userId?: string | null;
  action: string;
  entity: string;
  entityId: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  user?: Pick<User, 'id' | 'name' | 'phone'> | null;
}

// ─── Dashboard ────────────────────────────────────────────
export interface DashboardStats {
  totalBookings: number;
  totalCustomers: number;
  totalTechnicians: number;
  activeBookings: number;
}

// ─── Reports ──────────────────────────────────────────────
export interface RevenueDataPoint {
  date: string;
  revenue: number;
  bookings: number;
}

export interface ReportData {
  summary: {
    total: number;
    change: number;
  };
  data: RevenueDataPoint[];
}

// ─── API Response wrappers ────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
}

export interface PaginatedResponse<T = unknown> {
  success: boolean;
  items: T[];
  meta: PaginationMeta;
  message?: string;
  timestamp?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// ─── Query params ─────────────────────────────────────────
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BookingQueryParams extends PaginationParams {
  status?: BookingStatus;
  technicianId?: string;
  customerId?: string;
  from?: string;
  to?: string;
}

export interface TechnicianQueryParams extends PaginationParams {
  verificationStatus?: VerificationStatus;
  isAvailable?: boolean;
  isActive?: boolean;
}

export interface CustomerQueryParams extends PaginationParams {
  isActive?: boolean;
}
