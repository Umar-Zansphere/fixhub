export const endpoints = {
  // Auth
  auth: {
    adminLogin: '/auth/admin/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    me: '/auth/me',
  },

  // Admin — Dashboard
  admin: {
    dashboard: '/admin/dashboard',

    // Customers
    customers: '/admin/customers',
    customer: (id: string) => `/admin/customers/${id}`,
    customerStatus: (userId: string) => `/admin/customers/${userId}/status`,

    // Technicians
    technicians: '/admin/technicians',
    technician: (id: string) => `/admin/technicians/${id}`,
    technicianStatus: (userId: string) => `/admin/technicians/${userId}/status`,
    technicianVerify: (id: string) => `/admin/technicians/${id}/verify`,
    
    // System
    auditLogs: '/admin/audit-logs',
    settings: '/admin/settings',
  },

  // Bookings (admin)
  bookings: {
    list: '/admin/bookings',
    history: '/admin/bookings/history',
    detail: (id: string) => `/admin/bookings/${id}`,
    assign: (id: string) => `/admin/bookings/${id}/assign`,
  },

  // Catalog (admin endpoints for listing, creating, etc.)
  catalog: {
    categories: '/admin/categories',
    category: (id: string) => `/admin/categories/${id}`,
    services: '/admin/services',
    service: (id: string) => `/admin/services/${id}`,
    // Admin CRUD
    createCategory: '/admin/categories',
    updateCategory: (id: string) => `/admin/categories/${id}`,
    deleteCategory: (id: string) => `/admin/categories/${id}`,
    createService: '/admin/services',
    updateService: (id: string) => `/admin/services/${id}`,
    updatePricing: (id: string) => `/admin/services/${id}/pricing`,
    deleteService: (id: string) => `/admin/services/${id}`,
  },

  // Service Areas
  serviceAreas: {
    list: '/admin/service-areas',
    create: '/admin/service-areas',
    update: (id: string) => `/admin/service-areas/${id}`,
    delete: (id: string) => `/admin/service-areas/${id}`,
  },

  // Payments
  payments: {
    list: '/admin/bookings', // payments are fetched via bookings
    refund: (id: string) => `/admin/payments/${id}/refund`,
  },

  // Reports
  reports: {
    revenue: '/reports/revenue',
    bookings: '/reports/bookings',
    customers: '/reports/customers',
    technicians: '/reports/technicians',
    payments: '/reports/payments',
    cancellations: '/reports/cancellations',
    growth: '/reports/growth',
  },

  // Notifications
  notifications: {
    list: '/notifications',
    send: '/notifications/send',
    markRead: (id: string) => `/notifications/${id}/read`,
    markAllRead: '/notifications/read-all',
    template: (key: string) => `/notifications/templates/${key}`,
    preferences: '/notifications/preferences',
  },
} as const;
