'use client';

import { Car, CreditCard, BarChart3, Tags } from 'lucide-react';
import SectionHeader from '@/components/dashboard/SectionHeader';
import QuickActionCard from '@/components/dashboard/QuickActionCard';
import { APP_ROUTES } from '@/constants/routes';

const ACTIONS = [
  {
    title: 'Add Vehicle',
    description: 'Register a new unit in the fleet',
    href: APP_ROUTES.ADMIN.VEHICLE_NEW,
    icon: Car,
    tone: 'accent',
    enabled: true,
  },
  {
    title: 'View Payments',
    description: 'Review settlements and balances',
    href: APP_ROUTES.ADMIN.PAYMENTS,
    icon: CreditCard,
    tone: 'warning',
    enabled: true,
  },
  {
    title: 'Reports',
    description: 'Open operational report suites',
    href: APP_ROUTES.ADMIN.REPORTS,
    icon: BarChart3,
    tone: 'secondary',
    enabled: true,
  },
  {
    title: 'Categories',
    description: 'Manage vehicle category taxonomy',
    href: APP_ROUTES.ADMIN.CATEGORIES,
    icon: Tags,
    tone: 'accent',
    enabled: true,
  },
];

export default function QuickActions() {
  return (
    <div>
      <SectionHeader
        title="Quick Actions"
        description="Jump into common fleet and rental workflows"
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {ACTIONS.map((action, index) => (
          <QuickActionCard key={action.title} {...action} delay={index * 0.05} />
        ))}
      </div>
    </div>
  );
}
