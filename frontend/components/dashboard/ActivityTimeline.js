'use client';

import { Car, ClipboardList, CreditCard, RotateCcw } from 'lucide-react';
import WidgetContainer from '@/components/dashboard/WidgetContainer';
import SectionHeader from '@/components/dashboard/SectionHeader';
import ActivityCard from '@/components/dashboard/ActivityCard';
import EmptyState from '@/components/dashboard/EmptyState';
import SkeletonLoader from '@/components/common/SkeletonLoader';
import {
  customerName,
  formatCurrency,
  formatDateTime,
} from '@/lib/format';

function buildActivities({ recentRentals = [], recentPayments = [] }) {
  const items = [];

  recentRentals.slice(0, 4).forEach((order) => {
    const isReturn =
      order.orderStatus === 'Completed' || Boolean(order.actualReturnDate);
    const vehicleName = order.vehicle
      ? `${order.vehicle.brand} ${order.vehicle.model}`
      : 'Vehicle';

    items.push({
      id: `rental-${order.id}`,
      title: isReturn ? 'Return completed' : 'Rental created',
      description: `${customerName(order.customer)} · ${vehicleName}`,
      time: formatDateTime(order.updatedAt || order.createdAt),
      icon: isReturn ? RotateCcw : ClipboardList,
      tone: isReturn ? 'success' : 'accent',
      sortAt: new Date(order.updatedAt || order.createdAt).getTime(),
    });
  });

  recentPayments.slice(0, 4).forEach((payment) => {
    items.push({
      id: `payment-${payment.id}`,
      title: 'Payment completed',
      description: `${formatCurrency(payment.totalAmount)} · ${customerName(
        payment.customer || payment.order?.customer
      )}`,
      time: formatDateTime(payment.paymentDate || payment.createdAt),
      icon: CreditCard,
      tone: 'success',
      sortAt: new Date(payment.paymentDate || payment.createdAt).getTime(),
    });
  });

  // Synthetic fleet tip when sparse
  if (!items.length) {
    return [];
  }

  return items.sort((a, b) => b.sortAt - a.sortAt).slice(0, 8);
}

export default function ActivityTimeline({ recentRentals, recentPayments, loading }) {
  const activities = buildActivities({ recentRentals, recentPayments });

  return (
    <WidgetContainer delay={0.22}>
      <SectionHeader
        title="Activity Timeline"
        description="Derived from recent rentals and payments"
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonLoader key={i} height="3.5rem" rounded="xl" />
          ))}
        </div>
      ) : !activities.length ? (
        <EmptyState
          title="No recent activity"
          description="Timeline events appear when rentals and payments are recorded."
          icon={Car}
        />
      ) : (
        <ul className="space-y-0" aria-label="Activity timeline">
          {activities.map((activity, index) => (
            <ActivityCard key={activity.id} {...activity} delay={index * 0.04} />
          ))}
        </ul>
      )}
    </WidgetContainer>
  );
}
