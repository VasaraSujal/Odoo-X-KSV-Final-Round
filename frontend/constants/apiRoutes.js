/**
 * Central registry of backend API endpoints.
 * Base URL is provided by NEXT_PUBLIC_API_URL (e.g. http://localhost:5000/api).
 */
export const API_ROUTES = Object.freeze({
  HEALTH: '/health',

  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    ME: '/auth/me',
    LOGOUT: '/auth/logout',
    CHANGE_PASSWORD: '/auth/change-password',
  },

  USERS: {
    PROFILE: '/users/profile',
    LIST: '/users',
    BY_ID: (id) => `/users/${id}`,
  },

  CATEGORIES: {
    LIST: '/categories',
    BY_ID: (id) => `/categories/${id}`,
  },

  VEHICLES: {
    LIST: '/vehicles',
    BY_ID: (id) => `/vehicles/${id}`,
    IMAGES: (vehicleId) => `/vehicles/${vehicleId}/images`,
  },

  VEHICLE_IMAGES: {
    SET_PRIMARY: (id) => `/vehicle-images/${id}/primary`,
    BY_ID: (id) => `/vehicle-images/${id}`,
  },

  RENTAL_ORDERS: {
    LIST: '/rental-orders',
    BY_ID: (id) => `/rental-orders/${id}`,
    STATUS: (id) => `/rental-orders/${id}/status`,
    RECALCULATE: (id) => `/rental-orders/${id}/recalculate`,
    PICKUP: (id) => `/rental-orders/${id}/pickup`,
    RETURN: (id) => `/rental-orders/${id}/return`,
  },

  PAYMENTS: {
    LIST: '/payments',
    BY_ID: (id) => `/payments/${id}`,
    STATUS: (id) => `/payments/${id}/status`,
  },

  SECURITY_DEPOSITS: {
    LIST: '/security-deposits',
    BY_ID: (id) => `/security-deposits/${id}`,
    REFUND: (id) => `/security-deposits/${id}/refund`,
  },

  DASHBOARD: {
    OVERVIEW: '/dashboard/overview',
    REVENUE: '/dashboard/revenue',
    RENTALS: '/dashboard/rentals',
    VEHICLES: '/dashboard/vehicles',
    PAYMENTS: '/dashboard/payments',
  },

  REPORTS: {
    RENTALS: '/reports/rentals',
    REVENUE: '/reports/revenue',
    EXPORT_CSV: '/reports/export/csv',
    EXPORT_EXCEL: '/reports/export/excel',
    EXPORT_PDF: '/reports/export/pdf',
  },

  ANALYTICS: {
    REVENUE_TREND: '/analytics/revenue-trend',
    RENTAL_TREND: '/analytics/rental-trend',
  },

  STRIPE: {
    CREATE_PAYMENT_INTENT: '/stripe/create-payment-intent',
    CREATE_CHECKOUT_SESSION: '/stripe/create-checkout-session',
    PAYMENT: (paymentId) => `/stripe/payment/${paymentId}`,
    REFUND: (paymentId) => `/stripe/refund/${paymentId}`,
  },
});
