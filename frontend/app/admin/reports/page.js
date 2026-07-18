'use client';

import {
  BarChart3,
  Car,
  ClipboardList,
  CreditCard,
  AlertTriangle,
  IndianRupee,
  LineChart,
} from 'lucide-react';
import MasterPage from '@/components/master/MasterPage';
import ReportHubCard from '@/components/reports/ReportHubCard';
import { APP_ROUTES } from '@/constants/routes';

const REPORTS = [
  {
    title: 'Revenue Report',
    description: 'Successful payments, revenue totals, and method breakdowns.',
    href: APP_ROUTES.ADMIN.REPORTS_REVENUE,
    icon: IndianRupee,
    tone: 'success',
  },
  {
    title: 'Rental Report',
    description: 'Booking volume by status, customers, and vehicle assignments.',
    href: APP_ROUTES.ADMIN.REPORTS_RENTALS,
    icon: ClipboardList,
    tone: 'accent',
  },
  {
    title: 'Vehicle Report',
    description: 'Fleet availability, category mix, and utilization snapshot.',
    href: APP_ROUTES.ADMIN.REPORTS_VEHICLES,
    icon: Car,
    tone: 'secondary',
  },
  {
    title: 'Payment Report',
    description: 'Payment statuses, methods, and settlement trends.',
    href: APP_ROUTES.ADMIN.REPORTS_PAYMENTS,
    icon: CreditCard,
    tone: 'warning',
  },
  {
    title: 'Analytics Summary',
    description: 'Revenue and rental trend charts across the selected window.',
    href: APP_ROUTES.ADMIN.REPORTS_ANALYTICS,
    icon: LineChart,
    tone: 'accent',
  },
];

export default function ReportsOverviewPage() {
  return (
    <MasterPage
      title="Reports"
      description="Operational and financial report suites for the rental business"
      breadcrumbs={[
        { label: 'Admin', href: APP_ROUTES.ADMIN.ROOT },
        { label: 'Reports' },
      ]}
    >
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-border bg-white p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <BarChart3 size={18} aria-hidden />
        </div>
        <div>
          <p className="text-sm font-medium text-primary">Dashboard overview</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">
            Choose a report suite below. Each view supports date filters, charts,
            searchable tables, and CSV / Excel / PDF export where the API allows.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {REPORTS.map((report, index) => (
          <ReportHubCard key={report.href} {...report} delay={index * 0.05} />
        ))}
      </div>
    </MasterPage>
  );
}
