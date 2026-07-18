'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Car, CreditCard, ShieldCheck, FileText, CheckCircle, Circle, Clock } from 'lucide-react';
import MasterPage from '@/components/master/MasterPage';
import PageLoader from '@/components/common/PageLoader';
import ErrorState from '@/components/dashboard/ErrorState';
import { APP_ROUTES } from '@/constants/routes';
import rentalService from '@/services/rentalService';
import paymentService from '@/services/paymentService';
import securityDepositService from '@/services/securityDepositService';
import { formatCurrency, formatDate, formatDateTime, customerName } from '@/lib/format';
import { getErrorMessage } from '@/lib/apiResponse';

const STATUS_STYLE = {
  Active: 'bg-emerald-100 text-emerald-700',
  Confirmed: 'bg-blue-100 text-blue-700',
  Pending: 'bg-amber-100 text-amber-700',
  Completed: 'bg-slate-100 text-slate-600',
  Cancelled: 'bg-rose-100 text-rose-700',
};

const TIMELINE_STEPS = [
  { status: 'Pending', label: 'Booking Created', icon: Circle },
  { status: 'Confirmed', label: 'Confirmed', icon: CheckCircle },
  { status: 'Active', label: 'Vehicle Picked Up', icon: Car },
  { status: 'Returned', label: 'Vehicle Returned', icon: CheckCircle },
  { status: 'Completed', label: 'Completed', icon: CheckCircle },
];

const STATUS_ORDER = ['Pending', 'Confirmed', 'Active', 'Returned', 'Completed'];

function TimelineStep({ label, done, active, icon: Icon }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition
        ${done ? 'border-emerald-500 bg-emerald-500 text-white' : active ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-background text-muted'}`}>
        <Icon size={14} />
      </div>
      <div className="min-w-0 flex-1 pb-5 border-l border-border ml-[-17px] pl-6">
        <p className={`text-sm font-semibold ${done || active ? 'text-primary' : 'text-muted'}`}>{label}</p>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border/60 last:border-0">
      <span className="text-xs text-muted uppercase tracking-wide shrink-0">{label}</span>
      <span className="text-sm font-medium text-primary text-right">{value || '—'}</span>
    </div>
  );
}

export default function CustomerRentalDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [deposit, setDeposit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await rentalService.getRentalOrderById(id);
      const orderData = res.data;
      setOrder(orderData);

      // Fetch related payment and deposit in parallel
      const [payRes, depRes] = await Promise.allSettled([
        paymentService.getPayments({ orderId: id }),
        securityDepositService.getAll ? securityDepositService.getAll({ orderId: id }) : Promise.resolve(null),
      ]);

      if (payRes.status === 'fulfilled') {
        const payments = payRes.value.data?.payments || [];
        setPayment(payments[0] || null);
      }
      if (depRes.status === 'fulfilled' && depRes.value) {
        const deposits = depRes.value.data?.securityDeposits || depRes.value.data;
        setDeposit(Array.isArray(deposits) ? deposits[0] : deposits);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <PageLoader />;
  if (error || !order) {
    return (
      <MasterPage title="Rental Detail" backHref={APP_ROUTES.CUSTOMER.RENTALS}>
        <ErrorState description={error || 'Rental not found'} onRetry={load} />
      </MasterPage>
    );
  }

  const currentStatusIdx = STATUS_ORDER.indexOf(order.orderStatus);
  const vehicle = order.vehicle;

  return (
    <MasterPage
      title={vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Rental Detail'}
      description={`Booking #${order.orderNumber || order.id?.slice(0, 8)}`}
      backHref={APP_ROUTES.CUSTOMER.RENTALS}
      breadcrumbs={[
        { label: 'Customer', href: APP_ROUTES.CUSTOMER.DASHBOARD },
        { label: 'My Rentals', href: APP_ROUTES.CUSTOMER.RENTALS },
        { label: 'Details' },
      ]}
    >
      {/* Status + OTP banner */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${STATUS_STYLE[order.orderStatus] || 'bg-slate-100 text-slate-600'}`}>
          {order.orderStatus}
        </span>
        {order.orderStatus === 'Confirmed' && order.pickupOtp && (
          <div className="flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/5 px-4 py-2">
            <Clock size={16} className="text-accent" />
            <div>
              <p className="text-xs text-muted">Your Pickup OTP</p>
              <p className="text-2xl font-black tracking-[0.2em] text-accent">{order.pickupOtp}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        {/* LEFT */}
        <div className="space-y-5">
          {/* Vehicle Card */}
          {vehicle && (
            <div className="surface-card flex gap-4 p-4">
              <div className="h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                {vehicle.images?.[0]?.imageUrl ? (
                  <img src={vehicle.images[0].imageUrl} alt="" className="h-full w-full object-cover" />
                ) : <Car size={24} className="m-auto mt-7 text-muted/40" />}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-primary">{vehicle.brand} {vehicle.model}</p>
                <p className="text-xs text-muted">{vehicle.year} · {vehicle.fuelType} · {vehicle.transmission}</p>
                <p className="text-xs text-muted mt-1">Reg: {vehicle.registrationNumber}</p>
                <Link href={APP_ROUTES.CUSTOMER.VEHICLE_DETAIL(vehicle.id)} className="mt-1 text-xs font-semibold text-accent hover:underline">
                  View vehicle →
                </Link>
              </div>
            </div>
          )}

          {/* Rental Details */}
          <div className="surface-card p-5">
            <h2 className="mb-3 text-sm font-semibold text-primary">Rental Information</h2>
            <InfoRow label="Booking #" value={order.orderNumber} />
            <InfoRow label="Pickup Date" value={formatDate(order.pickupDate)} />
            <InfoRow label="Expected Return" value={formatDate(order.expectedReturnDate)} />
            <InfoRow label="Actual Return" value={order.actualReturnDate ? formatDate(order.actualReturnDate) : 'Not yet returned'} />
            <InfoRow label="Duration" value={`${order.rentalDuration} ${order.rentalUnit}(s)`} />
            <InfoRow label="Pickup Type" value={order.pickupType} />
            {order.pickupAddress && <InfoRow label="Address" value={order.pickupAddress} />}
          </div>

          {/* Timeline */}
          <div className="surface-card p-5">
            <h2 className="mb-4 text-sm font-semibold text-primary">Status Timeline</h2>
            <div className="space-y-0">
              {TIMELINE_STEPS.map((step, idx) => {
                const done = idx < currentStatusIdx;
                const active = idx === currentStatusIdx;
                return (
                  <TimelineStep
                    key={step.status}
                    label={step.label}
                    done={done}
                    active={active}
                    icon={step.icon}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-5">
          {/* Payment Summary */}
          <div className="surface-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <CreditCard size={16} className="text-accent" />
              <h2 className="text-sm font-semibold text-primary">Payment</h2>
            </div>
            <InfoRow label="Rental Amount" value={formatCurrency(order.rentalAmount)} />
            {payment ? (
              <>
                <InfoRow label="Total Paid" value={formatCurrency(payment.totalAmount)} />
                <InfoRow label="Method" value={payment.paymentMethod} />
                <InfoRow label="Status" value={payment.paymentStatus} />
                <InfoRow label="Paid On" value={formatDateTime(payment.paymentDate || payment.createdAt)} />
              </>
            ) : (
              <div className="mt-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-700">
                ⚠️ No payment recorded yet.
              </div>
            )}
          </div>

          {/* Invoice Receipt */}
          {order.invoice ? (
            <div className="surface-card p-5">
              <div className="mb-3 flex items-center gap-2">
                <FileText size={16} className="text-accent" />
                <h2 className="text-sm font-semibold text-primary">Invoice Receipt</h2>
              </div>
              <div className="mb-2 text-xs font-semibold text-primary">
                Invoice Number: {order.invoice.invoiceNumber}
              </div>
              <InfoRow label="Base Rent" value={formatCurrency(order.invoice.rentalAmount)} />
              <InfoRow label="Tax Amount (18%)" value={formatCurrency(order.invoice.taxAmount)} />
              <InfoRow label="Security Deposit" value={formatCurrency(order.invoice.depositAmount)} />
              {Number(order.invoice.penaltyAmount) > 0 && (
                <InfoRow label="Penalty / Late Fees" value={formatCurrency(order.invoice.penaltyAmount)} />
              )}
              <InfoRow label="Invoice Status" value={order.invoice.invoiceStatus} />
              <div className="border-t border-border mt-3 pt-3 flex justify-between items-center">
                <span className="text-sm font-bold text-primary">Total Amount</span>
                <span className="text-base font-bold text-accent">{formatCurrency(order.invoice.totalAmount)}</span>
              </div>
            </div>
          ) : null}

          {/* Security Deposit */}
          <div className="surface-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-500" />
              <h2 className="text-sm font-semibold text-primary">Security Deposit</h2>
            </div>
            {deposit ? (
              <>
                <InfoRow label="Deposit Amount" value={formatCurrency(deposit.depositAmount)} />
                <InfoRow label="Status" value={deposit.depositStatus} />
                {deposit.depositStatus === 'Released' && (
                  <>
                    <InfoRow label="Refund Status" value={deposit.refundStatus} />
                    <InfoRow label="Refund Amount" value={formatCurrency(deposit.refundAmount)} />
                    {deposit.refundDate && (
                      <InfoRow label="Refunded On" value={formatDate(deposit.refundDate)} />
                    )}
                    {deposit.refundMethod && (
                      <InfoRow label="Refund Method" value={deposit.refundMethod} />
                    )}
                  </>
                )}
                {deposit.penaltyAmount > 0 && <InfoRow label="Penalty Deducted" value={formatCurrency(deposit.penaltyAmount)} />}
                {deposit.penaltyReason && <InfoRow label="Penalty Reason" value={deposit.penaltyReason} />}
              </>
            ) : (
              <p className="text-xs text-muted">No deposit recorded for this booking.</p>
            )}
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="surface-card p-5">
              <div className="mb-2 flex items-center gap-2">
                <FileText size={16} className="text-muted" />
                <h2 className="text-sm font-semibold text-primary">Notes</h2>
              </div>
              <p className="text-sm text-secondary leading-relaxed">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </MasterPage>
  );
}
