'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CreditCard, ArrowRight } from 'lucide-react';
import MasterPage from '@/components/master/MasterPage';
import SkeletonLoader from '@/components/common/SkeletonLoader';
import PaymentStatusBadge from '@/components/finance/PaymentStatusBadge';
import { APP_ROUTES } from '@/constants/routes';
import paymentService from '@/services/paymentService';
import { formatCurrency, formatDate } from '@/lib/format';
import { getErrorMessage } from '@/lib/apiResponse';
import notify from '@/lib/toast';

export default function CustomerPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const res = await paymentService.getPayments({ page: pg, limit: 10, sortBy: 'createdAt', order: 'desc' });
      setPayments(res.data?.payments || []);
      setPagination((p) => ({ ...p, ...(res.data?.pagination || {}), page: pg }));
    } catch (err) {
      notify.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(1); }, [load]);

  return (
    <MasterPage
      title="My Payments"
      description={`${pagination.total} payment record${pagination.total !== 1 ? 's' : ''}`}
      breadcrumbs={[
        { label: 'Customer', href: APP_ROUTES.CUSTOMER.DASHBOARD },
        { label: 'Payments' },
      ]}
    >
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <SkeletonLoader key={i} height="4.5rem" rounded="2xl" />)}
        </div>
      ) : payments.length === 0 ? (
        <div className="surface-card py-16 text-center">
          <CreditCard size={44} className="mx-auto mb-4 text-muted/30" />
          <p className="text-sm font-semibold text-muted">No payments yet</p>
          <p className="text-xs text-muted/60 mt-1">Payments appear here once your bookings are confirmed.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => (
            <div key={p.id} className="surface-card flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/10">
                <CreditCard size={20} className="text-accent" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-semibold text-primary text-sm">
                  {p.order?.orderNumber || p.orderId?.slice(0, 8) || 'Payment'}
                </p>
                <p className="text-xs text-muted mt-0.5">{p.paymentMethod} · {formatDate(p.paymentDate || p.createdAt)}</p>
                {p.transactionId && (
                  <p className="text-xs text-muted/60 mt-0.5 truncate">Ref: {p.transactionId}</p>
                )}
              </div>

              <div className="shrink-0 text-right space-y-1">
                <p className="text-base font-bold text-primary tabular-nums">{formatCurrency(p.totalAmount)}</p>
                <PaymentStatusBadge status={p.paymentStatus} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pg) => (
            <button
              key={pg}
              type="button"
              onClick={() => load(pg)}
              className={`h-9 w-9 rounded-xl text-sm font-semibold transition
                ${pg === pagination.page
                  ? 'bg-accent text-white'
                  : 'border border-border text-muted hover:border-accent hover:text-accent'}`}
            >
              {pg}
            </button>
          ))}
        </div>
      )}
    </MasterPage>
  );
}
