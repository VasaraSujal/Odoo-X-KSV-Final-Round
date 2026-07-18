'use client';

import WidgetContainer from '@/components/dashboard/WidgetContainer';
import SectionHeader from '@/components/dashboard/SectionHeader';
import EmptyState from '@/components/dashboard/EmptyState';
import StatusBadge from '@/components/dashboard/StatusBadge';
import SkeletonLoader from '@/components/common/SkeletonLoader';
import {
  customerName,
  formatCurrency,
  formatDate,
} from '@/lib/format';
import notify from '@/lib/toast';

const methodLabel = {
  Cash: 'Cash',
  UPI: 'UPI',
  Card: 'Card',
  Net_Banking: 'Bank',
};

export default function RecentPayments({ payments = [], loading }) {
  return (
    <WidgetContainer delay={0.15}>
      <SectionHeader
        title="Recent Payments"
        description="Latest successful and pending settlements"
        action={
          <button
            type="button"
            onClick={() => notify.info('Payments module coming soon')}
            className="text-xs font-semibold text-accent hover:text-[#1d4ed8]"
          >
            View all
          </button>
        }
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonLoader key={i} height="3rem" rounded="xl" />
          ))}
        </div>
      ) : !payments.length ? (
        <EmptyState
          title="No payments yet"
          description="Payment activity will appear here once settlements are recorded."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] tracking-wide text-muted uppercase">
                <th className="pb-3 font-medium">Method</th>
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Rental</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr
                  key={payment.id}
                  className="border-b border-border/70 last:border-0"
                >
                  <td className="py-3.5 pr-3 font-medium text-primary">
                    {methodLabel[payment.paymentMethod] || payment.paymentMethod || '—'}
                  </td>
                  <td className="py-3.5 pr-3 text-secondary">
                    {customerName(payment.customer || payment.order?.customer)}
                  </td>
                  <td className="py-3.5 pr-3 text-secondary">
                    {payment.order?.orderNumber ||
                      payment.orderId?.slice(0, 8) ||
                      '—'}
                  </td>
                  <td className="py-3.5 pr-3 font-medium tabular-nums text-primary">
                    {formatCurrency(payment.totalAmount)}
                  </td>
                  <td className="py-3.5 pr-3">
                    <StatusBadge status={payment.paymentStatus} />
                  </td>
                  <td className="py-3.5 text-secondary">
                    {formatDate(payment.paymentDate || payment.createdAt)}
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
