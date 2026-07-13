export const endpoints = {
  // Auth
  auth: {
    sendOtp: '/auth/otp/send',
    verifyOtp: '/auth/otp/verify',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
  },

  // Admin
  admin: {
    dashboard: '/admin/dashboard',
    technicians: '/admin/technicians',
    technician: (id: string) => `/admin/technicians/${id}`,
    categories: '/admin/categories',
    category: (id: string) => `/admin/categories/${id}`,
    serviceAreas: '/admin/service-areas',
    serviceArea: (id: string) => `/admin/service-areas/${id}`,
    bookings: '/admin/bookings',
    booking: (id: string) => `/admin/bookings/${id}`,
    assignTechnician: (bookingId: string) => `/admin/bookings/${bookingId}/assign`,
  },

  // Reports
  reports: {
    bookingSummary: '/reports/bookings/summary',
  },
} as const;
