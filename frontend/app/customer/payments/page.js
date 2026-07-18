'use client';

import { useCallback, useEffect, useState } from 'react';
import { CreditCard, ArrowRight, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import MasterPage from '@/components/master/MasterPage';
import SkeletonLoader from '@/components/common/SkeletonLoader';
import PaymentStatusBadge from '@/components/finance/PaymentStatusBadge';
import { APP_ROUTES } from '@/constants/routes';
import paymentService from '@/services/paymentService';
import securityDepositService from '@/services/securityDepositService';
import { formatCurrency, formatDate } from '@/lib/format';
import { getErrorMessage } from '@/lib/apiResponse';
import notify from '@/lib/toast';

export default function CustomerPaymentsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch both payments and security deposits
      const [payRes, depRes] = await Promise.all([
        paymentService.getPayments({ limit: 100, sortBy: 'createdAt', order: 'desc' }),
        securityDepositService.getDeposits({ limit: 100 }),
      ]);

      const paymentsList = payRes.data?.payments || [];
      const depositsList = depRes.data?.deposits || [];

      // Map payments to standard transaction format
      const mappedPayments = paymentsList.map((p) => {
        const depositAmt = Number(p.order?.securityDeposit?.depositAmount || 0);
        return {
          id: p.id,
          type: 'payment',
          orderId: p.orderId,
          orderNumber: p.order?.orderNumber || p.orderId?.slice(0, 8),
          method: p.paymentMethod,
          date: p.paymentDate || p.createdAt,
          amount: Number(p.totalAmount) + depositAmt,
          status: p.paymentStatus,
          transactionId: p.transactionId,
        };
      });

      // Map security deposit refunds to standard transaction format (only if released/refunded)
      const mappedRefunds = depositsList
        .filter((d) => d.depositStatus === 'Released')
        .map((d) => ({
          id: d.id + '-refund',
          type: 'refund',
          orderId: d.orderId,
          orderNumber: d.order?.orderNumber || d.orderId?.slice(0, 8),
          method: d.refundMethod || 'UPI',
          date: d.refundDate || d.createdAt,
          amount: Number(d.refundAmount),
          status: d.refundStatus === 'Refunded' ? 'Refunded' : 'Partially Refunded',
          transactionId: null,
        }));

      // Combine and sort by date descending
      const combined = [...mappedPayments, ...mappedRefunds].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

      setTransactions(combined);
    } catch (err) {
      notify.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <MasterPage
      title="Transaction Statement"
      description="View your payments and security deposit refunds"
      breadcrumbs={[
        { label: 'Customer', href: APP_ROUTES.CUSTOMER.DASHBOARD },
        { label: 'Payments & Statement' },
      ]}
    >
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <SkeletonLoader key={i} height="4.5rem" rounded="2xl" />)}
        </div>
      ) : transactions.length === 0 ? (
        <div className="surface-card py-16 text-center">
          <CreditCard size={44} className="mx-auto mb-4 text-muted/30" />
          <p className="text-sm font-semibold text-muted">No transactions found</p>
          <p className="text-xs text-muted/60 mt-1">Payments and refunds appear here once processed.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => {
            const isRefund = tx.type === 'refund';
            return (
              <div key={tx.id} className="surface-card flex items-center gap-4 p-4 hover:shadow-sm transition">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                  isRefund ? 'bg-emerald-50 text-emerald-600' : 'bg-accent/10 text-accent'
                }`}>
                  {isRefund ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary text-sm">
                      {isRefund ? 'Security Deposit Refund' : 'Rental Charge Payment'}
                    </span>
                    <span className="text-xs text-muted">
                      ({tx.orderNumber})
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">{tx.method} · {formatDate(tx.date)}</p>
                  {tx.transactionId && (
                    <p className="text-xs text-muted/60 mt-0.5 truncate">Ref: {tx.transactionId}</p>
                  )}
                </div>

                <div className="shrink-0 text-right space-y-1">
                  <p className={`text-base font-bold tabular-nums ${
                    isRefund ? 'text-emerald-600' : 'text-primary'
                  }`}>
                    {isRefund ? '+' : ''}{formatCurrency(tx.amount)}
                  </p>
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${
                    isRefund ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </MasterPage>
  );
}
