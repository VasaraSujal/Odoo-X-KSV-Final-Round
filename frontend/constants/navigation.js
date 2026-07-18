import {
  LayoutDashboard,
  Car,
  Tags,
  CalendarRange,
  ClipboardList,
  FileText,
  CreditCard,
  Shield,
  PackageCheck,
  PackageOpen,
  AlertTriangle,
  BarChart3,
  Settings,
  User,
} from 'lucide-react';
import { APP_ROUTES } from '@/constants/routes';

/**
 * Sidebar order follows rental business workflow:
 * Overview → Fleet → Orders → Finance → Operations → Insights → Config
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
    id: 'rental-periods',
    label: 'Rental Periods',
    href: APP_ROUTES.ADMIN.RENTAL_PERIODS,
    icon: CalendarRange,
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
    id: 'quotations',
    label: 'Quotations',
    href: APP_ROUTES.ADMIN.QUOTATIONS,
    icon: FileText,
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
    id: 'pickups',
    label: 'Pickups',
    href: APP_ROUTES.ADMIN.PICKUPS,
    icon: PackageCheck,
    enabled: true,
  },
  {
    id: 'returns',
    label: 'Returns',
    href: APP_ROUTES.ADMIN.RETURNS,
    icon: PackageOpen,
    enabled: true,
  },
  {
    id: 'penalties',
    label: 'Penalties',
    href: APP_ROUTES.ADMIN.PENALTIES,
    icon: AlertTriangle,
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
    id: 'settings',
    label: 'Settings',
    href: APP_ROUTES.ADMIN.SETTINGS,
    icon: Settings,
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
    id: 'overview',
    label: 'Overview',
    href: APP_ROUTES.CUSTOMER.DASHBOARD,
    icon: LayoutDashboard,
    enabled: true,
  },
  {
    id: 'browse',
    label: 'Browse Vehicles',
    href: APP_ROUTES.CUSTOMER.VEHICLES,
    icon: Car,
    enabled: false,
  },
  {
    id: 'rentals',
    label: 'My Rentals',
    href: APP_ROUTES.CUSTOMER.RENTALS,
    icon: ClipboardList,
    enabled: false,
  },
  {
    id: 'payments',
    label: 'Payments',
    href: APP_ROUTES.CUSTOMER.PAYMENTS,
    icon: CreditCard,
    enabled: false,
  },
  {
    id: 'profile',
    label: 'Profile',
    href: APP_ROUTES.CUSTOMER.PROFILE,
    icon: User,
    enabled: false,
  },
];
