'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Undo2 } from 'lucide-react';
import MasterPage from '@/components/master/MasterPage';
import InfoCard, { InfoRow } from '@/components/rental/InfoCard';
import DepositCard from '@/components/finance/DepositCard';
import PaymentStatusBadge from '@/components/finance/PaymentStatusBadge';
import TransactionCard from '@/components/finance/TransactionCard';
import Button from '@/components/ui/Button';
import PageLoader from '@/components/common/PageLoader';
import ErrorState from '@/components/dashboard/ErrorState';
import securityDepositService from '@/services/securityDepositService';
import rentalService from '@/services/rentalService';
import { APP_ROUTES } from '@/constants/routes';
import { remainingDeposit } from '@/lib/finance';
import {
  customerName,
  formatCurrency,
  formatDateTime,
  vehicleLabel,
} from '@/lib/format';
import { getErrorMessage } from '@/lib/apiResponse';

export default function DepositDetailPage() {
  const { id } = useParams();
  const [deposit, setDeposit] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await securityDepositService.getById(id);
      const data = result.data;
      setDeposit(data);
      if (data?.orderId) {
        const orderResult = await rentalService.getRentalOrderById(
          data.orderId
        );
        setOrder(orderResult.data);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <MasterPage
        title="Deposit Details"
        backHref={APP_ROUTES.ADMIN.SECURITY_DEPOSITS}
      >
        <PageLoader />
      </MasterPage>
    );
  }

  if (error || !deposit) {
    return (
      <MasterPage
        title="Deposit Details"
        backHref={APP_ROUTES.ADMIN.SECURITY_DEPOSITS}
      >
        <div className="surface-card">
          <ErrorState description={error || 'Deposit not found'} onRetry={load} />
        </div>
      </MasterPage>
    );
  }

  const rental = order || deposit.order;
  const remaining = remainingDeposit(deposit);
  
  const isRefunded = String(deposit.refundStatus || '').toUpperCase() === 'REFUNDED';
  const isCompleted = String(rental?.orderStatus || '').toUpperCase() === 'COMPLETED';
  const canRefund = !isRefunded && isCompleted && deposit.depositStatus === 'Released';

  return (
    <MasterPage
      title="Deposit Details"
      description={formatCurrency(deposit.depositAmount)}
      backHref={APP_ROUTES.ADMIN.SECURITY_DEPOSITS}
      breadcrumbs={[
        { label: 'Admin', href: APP_ROUTES.ADMIN.ROOT },
        { label: 'Security Deposits', href: APP_ROUTES.ADMIN.SECURITY_DEPOSITS },
        { label: 'Details' },
      ]}
      actions={
        canRefund ? (
          <Link href={APP_ROUTES.ADMIN.SECURITY_DEPOSIT_REFUND(deposit.id)}>
            <Button size="sm">
              <Undo2 size={14} />
              Refund
            </Button>
          </Link>
        ) : null
      }
    >
      <div className="mb-4">
        <PaymentStatusBadge status={deposit.refundStatus} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <InfoCard title="Deposit summary">
            <dl>
              <InfoRow
                label="Collected"
                value={formatCurrency(deposit.depositAmount)}
              />
              <InfoRow
                label="Refunded"
                value={formatCurrency(deposit.refundAmount)}
              />
              <InfoRow
                label="Damage / Penalty cost"
                value={formatCurrency(deposit.penaltyAmount)}
              />
              <InfoRow
                label="Remaining"
                value={formatCurrency(remaining)}
              />
              <InfoRow label="Reason / Remarks" value={deposit.remarks || deposit.penaltyReason || '—'} />
              <InfoRow
                label="Collected at"
                value={formatDateTime(deposit.createdAt)}
              />
              {deposit.refundDate && (
                <InfoRow
                  label="Refunded Date"
                  value={formatDateTime(deposit.refundDate)}
                />
              )}
            </dl>
          </InfoCard>

          <InfoCard title="Associated rental">
            <dl>
              <InfoRow
                label="Booking"
                value={
                  rental?.id ? (
                    <Link
                      href={APP_ROUTES.ADMIN.RENTAL_ORDER_DETAIL(rental.id)}
                      className="text-accent hover:underline"
                    >
                      {rental.orderNumber}
                    </Link>
                  ) : (
                    '—'
                  )
                }
              />
              <InfoRow label="Customer" value={customerName(rental?.customer || deposit.customer)} />
              <InfoRow
                label="Vehicle"
                value={rental?.vehicle ? `${rental.vehicle.brand} ${rental.vehicle.model}` : '—'}
              />
              <InfoRow label="Rental status" value={rental?.orderStatus || '—'} />
              <InfoRow
                label="Required deposit"
                value={formatCurrency(deposit.depositAmount)}
              />
            </dl>
          </InfoCard>

          {Number(deposit.refundAmount) > 0 ? (
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-primary">
                Refund history
              </h3>
              <TransactionCard
                title="Refund processed"
                amount={deposit.refundAmount}
                status={deposit.refundStatus}
                date={deposit.refundDate || deposit.updatedAt}
                type="refund"
              />
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <DepositCard deposit={{ ...deposit, rentalOrder: rental }} />
          {!isCompleted && !isRefunded ? (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-warning">
              Refunds are only allowed after the rental order status is
              Completed.
            </p>
          ) : null}
          {isCompleted && deposit.depositStatus === 'Held' && !isRefunded ? (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-warning">
              Please release the deposit or process manual refund step inside the rental order closure page first.
            </p>
          ) : null}
        </div>
      </div>
    </MasterPage>
  );
}
