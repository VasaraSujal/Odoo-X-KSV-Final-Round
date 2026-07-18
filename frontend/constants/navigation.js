import {
  LayoutDashboard,
  Car,
  Tags,
  ClipboardList,
  Users,
  CreditCard,
  Shield,
  BarChart3,
  User,
  ShoppingCart,
  Receipt,
  CalendarRange,
} from 'lucide-react';
import { APP_ROUTES } from '@/constants/routes';

/**
 * Sidebar navigation items aligned with restructured backend ERP modules.
 */
export const ADMIN_NAV = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: APP_ROUTES.ADMIN.DASHBOARD,
    icon: LayoutDashboard,
    enabled: true,
  },
  {
    id: 'vehicles',
    label: 'Vehicles',
    href: APP_ROUTES.ADMIN.VEHICLES,
    icon: Car,
    enabled: true,
  },
  {
    id: 'categories',
    label: 'Categories',
    href: APP_ROUTES.ADMIN.CATEGORIES,
    icon: Tags,
    enabled: true,
  },
  {
    id: 'rental-orders',
    label: 'Rental Orders',
    href: APP_ROUTES.ADMIN.RENTAL_ORDERS,
    icon: ClipboardList,
    enabled: true,
  },
  {
    id: 'customers',
    label: 'Customers',
    href: APP_ROUTES.ADMIN.CUSTOMERS,
    icon: Users,
    enabled: true,
  },
  {
    id: 'payments',
    label: 'Payments',
    href: APP_ROUTES.ADMIN.PAYMENTS,
    icon: CreditCard,
    enabled: true,
  },
  {
    id: 'security-deposits',
    label: 'Security Deposits',
    href: APP_ROUTES.ADMIN.SECURITY_DEPOSITS,
    icon: Shield,
    enabled: true,
  },
  {
    id: 'reports',
    label: 'Reports',
    href: APP_ROUTES.ADMIN.REPORTS,
    icon: BarChart3,
    enabled: true,
  },
  {
    id: 'profile',
    label: 'Profile',
    href: APP_ROUTES.ADMIN.PROFILE,
    icon: User,
    enabled: true,
  },
];

export const CUSTOMER_NAV = [
  {
    id: 'browse',
    label: 'Browse Cars',
    href: APP_ROUTES.CUSTOMER.VEHICLES,
    icon: Car,
    enabled: true,
  },
  {
    id: 'cart',
    label: 'Cart',
    href: APP_ROUTES.CUSTOMER.CART,
    icon: ShoppingCart,
    enabled: true,
  },
  {
    id: 'rentals',
    label: 'My Rentals',
    href: APP_ROUTES.CUSTOMER.RENTALS,
    icon: CalendarRange,
    enabled: true,
  },
  {
    id: 'invoices',
    label: 'Invoices',
    href: APP_ROUTES.CUSTOMER.PAYMENTS,
    icon: Receipt,
    enabled: true,
  },
  {
    id: 'profile',
    label: 'Profile',
    href: APP_ROUTES.CUSTOMER.PROFILE,
    icon: User,
    enabled: true,
  },
];
