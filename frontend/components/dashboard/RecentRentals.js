'use client';

import Link from 'next/link';
import { Eye } from 'lucide-react';
import WidgetContainer from '@/components/dashboard/WidgetContainer';
import SectionHeader from '@/components/dashboard/SectionHeader';
import EmptyState from '@/components/dashboard/EmptyState';
import StatusBadge from '@/components/dashboard/StatusBadge';
import SkeletonLoader from '@/components/common/SkeletonLoader';
import { APP_ROUTES } from '@/constants/routes';
import {
  customerName,
  formatCurrency,
  formatDate,
} from '@/lib/format';
import notify from '@/lib/toast';

export default function RecentRentals({ rentals = [], loading }) {
  return (
    <WidgetContainer delay={0.1}>
      <SectionHeader
        title="Recent Rentals"
        description="Latest booking activity across the fleet"
        action={
          <button
            type="button"
            onClick={() => notify.info('Rental orders module coming soon')}
            className="text-xs font-semibold text-accent hover:text-[#1d4ed8]"
          >
            View all
          </button>
        }
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonLoader key={i} height="3.25rem" rounded="xl" />
          ))}
        </div>
      ) : !rentals.length ? (
        <EmptyState
          title="No rentals yet"
          description="New rental orders will show up here as soon as bookings are created."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] tracking-wide text-muted uppercase">
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Vehicle</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Pickup</th>
                <th className="pb-3 font-medium">Return</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rentals.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-border/70 last:border-0"
                >
                  <td className="py-3.5 pr-3">
                    <p className="font-medium text-primary">
                      {customerName(order.customer)}
                    </p>
                    <p className="text-[11px] text-muted">
                      {order.orderNumber || order.id?.slice(0, 8)}
                    </p>
                  </td>
                  <td className="py-3.5 pr-3 text-secondary">
                    {order.vehicle
                      ? `${order.vehicle.brand} ${order.vehicle.model}`
                      : '—'}
                  </td>
                  <td className="py-3.5 pr-3">
                    <StatusBadge status={order.orderStatus} />
                  </td>
                  <td className="py-3.5 pr-3 text-secondary">
                    {formatDate(order.pickupDate)}
                  </td>
                  <td className="py-3.5 pr-3 text-secondary">
                    {formatDate(order.expectedReturnDate)}
                  </td>
                  <td className="py-3.5 pr-3 font-medium tabular-nums text-primary">
                    {formatCurrency(order.rentalAmount)}
                  </td>
                  <td className="py-3.5 text-right">
                    <Link
                      href={APP_ROUTES.ADMIN.RENTAL_ORDER_DETAIL(order.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border text-muted transition hover:border-accent hover:text-accent"
                      aria-label={`View rental ${order.orderNumber || order.id}`}
                    >
                      <Eye size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </WidgetContainer>
  );
}
