/**
 * Frontend application routes.
 * Used by middleware and navigation — do not hardcode path strings elsewhere.
 */
export const APP_ROUTES = Object.freeze({
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  ADMIN: {
    ROOT: '/admin',
    DASHBOARD: '/admin',
    VEHICLES: '/admin/vehicles',
    VEHICLE_NEW: '/admin/vehicles/new',
    VEHICLE_DETAIL: (id) => `/admin/vehicles/${id}`,
    VEHICLE_EDIT: (id) => `/admin/vehicles/${id}/edit`,
    CATEGORIES: '/admin/categories',
    CATEGORY_NEW: '/admin/categories/new',
    CATEGORY_DETAIL: (id) => `/admin/categories/${id}`,
    CATEGORY_EDIT: (id) => `/admin/categories/${id}/edit`,
    RENTAL_PERIODS: '/admin/rental-periods',
    RENTAL_PERIOD_NEW: '/admin/rental-periods/new',
    RENTAL_PERIOD_DETAIL: (id) => `/admin/rental-periods/${id}`,
    RENTAL_PERIOD_EDIT: (id) => `/admin/rental-periods/${id}/edit`,
    PRICE_LISTS: '/admin/price-lists',
    PRICE_LIST_NEW: '/admin/price-lists/new',
    PRICE_LIST_DETAIL: (id) => `/admin/price-lists/${id}`,
    PRICE_LIST_EDIT: (id) => `/admin/price-lists/${id}/edit`,
    RENTAL_ORDERS: '/admin/rental-orders',
    RENTAL_ORDER_NEW: '/admin/rental-orders/new',
    RENTAL_ORDER_DETAIL: (id) => `/admin/rental-orders/${id}`,
    RENTAL_ORDER_EDIT: (id) => `/admin/rental-orders/${id}/edit`,
    CUSTOMERS: '/admin/customers',
    CUSTOMER_DETAIL: (id) => `/admin/customers/${id}`,
    QUOTATIONS: '/admin/quotations',
    QUOTATION_DETAIL: (id) => `/admin/quotations/${id}`,
    QUOTATION_BY_ORDER: (orderId) => `/admin/quotations/order/${orderId}`,
    PAYMENTS: '/admin/payments',
    PAYMENT_NEW: '/admin/payments/new',
    PAYMENT_DETAIL: (id) => `/admin/payments/${id}`,
    PAYMENT_EDIT: (id) => `/admin/payments/${id}/edit`,
    PAYMENT_RECEIPT: (id) => `/admin/payments/${id}/receipt`,
    PAYMENT_HISTORY: '/admin/payments/history',
    PAYMENT_STRIPE_SUCCESS: '/admin/payments/stripe/success',
    PAYMENT_STRIPE_CANCEL: '/admin/payments/stripe/cancel',
    PAYMENT_STRIPE_INTENT: '/admin/payments/stripe/intent',
    SECURITY_DEPOSITS: '/admin/security-deposits',
    SECURITY_DEPOSIT_NEW: '/admin/security-deposits/new',
    SECURITY_DEPOSIT_DETAIL: (id) => `/admin/security-deposits/${id}`,
    SECURITY_DEPOSIT_REFUND: (id) => `/admin/security-deposits/${id}/refund`,
    PICKUPS: '/admin/pickups',
    PICKUP_NEW: '/admin/pickups/new',
    PICKUP_DETAIL: (id) => `/admin/pickups/${id}`,
    RETURNS: '/admin/returns',
    RETURN_NEW: '/admin/returns/new',
    RETURN_DETAIL: (id) => `/admin/returns/${id}`,
    PENALTIES: '/admin/penalties',
    PENALTY_NEW: '/admin/penalties/new',
    PENALTY_DETAIL: (id) => `/admin/penalties/${id}`,
    REPORTS: '/admin/reports',
    REPORTS_REVENUE: '/admin/reports/revenue',
    REPORTS_RENTALS: '/admin/reports/rentals',
    REPORTS_VEHICLES: '/admin/reports/vehicles',
    REPORTS_PAYMENTS: '/admin/reports/payments',
    REPORTS_PENALTIES: '/admin/reports/penalties',
    REPORTS_ANALYTICS: '/admin/reports/analytics',
    SETTINGS: '/admin/settings',
    PROFILE: '/admin/profile',
  },
  CUSTOMER: {
    ROOT: '/customer',
    DASHBOARD: '/customer',
    VEHICLES: '/customer/vehicles',
    CART: '/customer/cart',
    RENTALS: '/customer/rentals',
    PAYMENTS: '/customer/payments',
    PROFILE: '/customer/profile',
  },
});

/** Path prefixes that require authentication */
export const PROTECTED_PREFIXES = Object.freeze([
  APP_ROUTES.ADMIN.ROOT,
  APP_ROUTES.CUSTOMER.ROOT,
]);

export const AUTH_COOKIE = 'token';
export const ROLE_COOKIE = 'role';
export const TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;
