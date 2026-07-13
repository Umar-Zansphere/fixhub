// ============================================
// Shared TypeScript types for the admin panel
// ============================================

export type Role = 'CUSTOMER' | 'TECHNICIAN' | 'ADMIN';

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'TECHNICIAN_ASSIGNED'
  | 'TECHNICIAN_EN_ROUTE'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'REFUNDED';

export interface User {
  id: string;
  phone: string;
  email?: string;
  name?: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface Technician {
  id: string;
  userId: string;
  user: User;
  isAvailable: boolean;
  isVerified: boolean;
  rating: number;
  totalJobs: number;
  serviceAreas: ServiceArea[];
}

export interface Customer {
  id: string;
  userId: string;
  user: User;
  addresses: Address[];
}

export interface Address {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
}

export interface ServiceArea {
  id: string;
  name: string;
  pincode: string;
  city: string;
  state: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  isActive: boolean;
  sortOrder: number;
  subServices?: SubService[];
}

export interface SubService {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  basePrice: number;
  estimatedDuration: number;
  isActive: boolean;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  customerId: string;
  technicianId?: string;
  subServiceId: string;
  addressId: string;
  status: BookingStatus;
  scheduledDate: string;
  scheduledSlot: string;
  description?: string;
  totalAmount: number;
  createdAt: string;
  customer?: Customer;
  technician?: Technician;
  subService?: SubService;
  address?: Address;
}

export interface DashboardStats {
  totalBookings: number;
  totalCustomers: number;
  totalTechnicians: number;
  activeBookings: number;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
}

export interface PaginatedResponse<T = unknown> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
  message: string;
  timestamp: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
