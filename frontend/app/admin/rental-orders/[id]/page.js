'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Ban,
  CheckCircle2,
  Play,
  Printer,
  Trash2,
  Key,
  ShieldAlert,
  FileCheck
} from 'lucide-react';
import MasterPage from '@/components/master/MasterPage';
import StatusBadge from '@/components/dashboard/StatusBadge';
import InfoCard, { InfoRow } from '@/components/rental/InfoCard';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import PageLoader from '@/components/common/PageLoader';
import ErrorState from '@/components/dashboard/ErrorState';
import SectionHeader from '@/components/dashboard/SectionHeader';
import rentalService from '@/services/rentalService';
import securityDepositService from '@/services/securityDepositService';
import userService from '@/services/userService';
import { APP_ROUTES } from '@/constants/routes';
import {
  customerName,
  formatCurrency,
  formatDate,
  formatDateTime
} from '@/lib/format';
import { getErrorMessage } from '@/lib/apiResponse';
import notify from '@/lib/toast';

export default function RentalOrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [activeTab, setActiveTab] = useState('rental');

  // Verification & Return form states
  const [otpInput, setOtpInput] = useState('');
  const [returnCondition, setReturnCondition] = useState('Good');
  const [penaltyAmount, setPenaltyAmount] = useState('0');
  const [penaltyReason, setPenaltyReason] = useState('');
  const [returnRemarks, setReturnRemarks] = useState('Returned and inspected safely.');

  // Manual Refund States
  const [refundMethod, setRefundMethod] = useState('UPI');
  const [refundRef, setRefundRef] = useState('');
  const [refunding, setRefunding] = useState(false);

  async function handleProcessRefund() {
    if (!order?.securityDeposit?.id) return;
    if (order.securityDeposit.refundStatus !== 'Pending') return;
    if (refundMethod !== 'Cash' && !refundRef.trim()) {
      notify.error('Please enter UPI or Bank transfer reference ID');
      return;
    }
    setRefunding(true);
    try {
      await securityDepositService.refund(order.securityDeposit.id, {
        penaltyAmount: Number(order.securityDeposit.penaltyAmount || 0),
        penaltyReason: order.securityDeposit.penaltyReason || null,
        refundMethod,
        remarks: refundRef
      });
      notify.success('Security deposit refunded successfully');
      load();
    } catch (err) {
      notify.error(getErrorMessage(err));
    } finally {
      setRefunding(false);
    }
  }

  const [verifyingCustomer, setVerifyingCustomer] = useState(false);

  async function handleVerifyCustomer() {
    if (!order?.customerId) return;
    setVerifyingCustomer(true);
    try {
      await userService.updateUser(order.customerId, { isVerified: true });
      notify.success('Customer Driving License verified successfully!');
      load();
    } catch (err) {
      notify.error(getErrorMessage(err));
    } finally {
      setVerifyingCustomer(false);
    }
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await rentalService.getRentalOrderById(id);
      setOrder(result.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleVerifyPickup() {
    if (!otpInput) {
      notify.error('Please enter the 4-digit OTP');
      return;
    }
    setBusy(true);
    try {
      await rentalService.pickup(id, otpInput);
      notify.success('Vehicle pickup verified successfully!');
      setOtpInput('');
      load();
    } catch (err) {
      notify.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleCompleteReturn() {
    setBusy(true);
    try {
      const payload = {
        returnCondition,
        returnRemarks,
        penaltyAmount: Number(penaltyAmount) || 0,
        penaltyReason: Number(penaltyAmount) > 0 ? penaltyReason : null
      };
      await rentalService.returnVehicle(id, payload);
      notify.success('Vehicle return and inspection registered successfully!');
      load();
    } catch (err) {
      notify.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function runStatus(status) {
    setBusy(true);
    try {
      await rentalService.updateStatus(id, status);
      notify.success(`Status updated to ${status}`);
      setConfirm(null);
      load();
    } catch (err) {
      notify.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await rentalService.remove(id);
      notify.success('Rental deleted');
      router.push(APP_ROUTES.ADMIN.RENTAL_ORDERS);
    } catch (err) {
      notify.error(getErrorMessage(err));
      setConfirm(null);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <MasterPage title="Rental Details" backHref={APP_ROUTES.ADMIN.RENTAL_ORDERS}>
        <PageLoader />
      </MasterPage>
    );
  }

  if (error || !order) {
    return (
      <MasterPage title="Rental Details" backHref={APP_ROUTES.ADMIN.RENTAL_ORDERS}>
        <div className="surface-card">
          <ErrorState description={error || 'Not found'} onRetry={load} />
        </div>
      </MasterPage>
    );
  }

  return (
    <MasterPage
      title={order.orderNumber}
      description={`${customerName(order.customer)} · ${order.rentalDuration} ${order.rentalUnit}s`}
      backHref={APP_ROUTES.ADMIN.RENTAL_ORDERS}
      breadcrumbs={[
        { label: 'Admin', href: APP_ROUTES.ADMIN.ROOT },
        { label: 'Rental Orders', href: APP_ROUTES.ADMIN.RENTAL_ORDERS },
        { label: order.orderNumber },
      ]}
      actions={
        <>
          {order.orderStatus === 'Pending' ? (
            <>
              <Button
                size="sm"
                onClick={() => setConfirm({ type: 'confirm' })}
                disabled={busy}
              >
                <CheckCircle2 size={14} />
                Confirm Order
              </Button>
            </>
          ) : null}
          {order.orderStatus !== 'Cancelled' &&
          order.orderStatus !== 'Completed' ? (
            <Button
              size="sm"
              variant="outline"
              className="text-warning"
              onClick={() => setConfirm({ type: 'cancel' })}
              disabled={busy}
            >
              <Ban size={14} />
              Cancel Order
            </Button>
          ) : null}
          {order.orderStatus === 'Pending' || order.orderStatus === 'Cancelled' ? (
            <Button
              size="sm"
              variant="danger"
              onClick={() => setConfirm({ type: 'delete' })}
              disabled={busy}
            >
              <Trash2 size={14} />
              Delete Order
            </Button>
          ) : null}
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          {/* Tab Switcher */}
          <div className="flex gap-4 border-b border-border pb-2 mb-4">
            <button
              onClick={() => setActiveTab('rental')}
              className={`pb-2 px-2 text-sm font-semibold border-b-2 transition
                ${activeTab === 'rental' ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-primary'}`}
            >
              🚗 Vehicle & Booking Info
            </button>
            <button
              onClick={() => setActiveTab('customer')}
              className={`pb-2 px-2 text-sm font-semibold border-b-2 transition
                ${activeTab === 'customer' ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-primary'}`}
            >
              👤 Customer Verification
            </button>
          </div>

          {activeTab === 'rental' ? (
            <>
              {/* Main Booking Overview */}
              <InfoCard title="Booking Overview">
            <dl>
              <InfoRow label="Order Status" value={<StatusBadge status={order.orderStatus} />} />
              <InfoRow
                label="Rental Payment status"
                value={<StatusBadge status={order.payment?.paymentStatus || 'Pending'} />}
              />
              {order.payment?.paymentMethod && (
                <InfoRow label="Payment Method" value={order.payment.paymentMethod} />
              )}
              {order.payment?.transactionId && (
                <InfoRow label="Payment Reference ID" value={<span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-bold">{order.payment.transactionId}</span>} />
              )}
              <InfoRow label="Customer" value={customerName(order.customer)} />
              <InfoRow label="Email" value={order.customer?.email} />
              <InfoRow label="Phone" value={order.customer?.phone || '—'} />
              <InfoRow label="Rental Unit" value={order.rentalUnit} />
              <InfoRow label="Duration" value={`${order.rentalDuration} ${order.rentalUnit}s`} />
              <InfoRow label="Pickup Schedule" value={formatDateTime(order.pickupDate)} />
              <InfoRow label="Expected Return" value={formatDateTime(order.expectedReturnDate)} />
              <InfoRow label="Actual Return" value={order.actualReturnDate ? formatDateTime(order.actualReturnDate) : '—'} />
              <InfoRow label="Delivery Location" value={order.pickupType === 'Home_Delivery' && order.deliveryAddress ? `${order.deliveryAddress.addressLine1}, ${order.deliveryAddress.city}` : 'Store Pickup'} />
              <InfoRow label="Created At" value={formatDateTime(order.createdAt)} />
            </dl>
          </InfoCard>

          {/* Rented Vehicle Card */}
          <div className="surface-card p-5 sm:p-6">
            <SectionHeader title="Rented Vehicle" description="Vehicle allocated for this booking" />
            {order.vehicle ? (
              <div className="flex gap-4 items-center mt-4">
                {order.vehicle.thumbnail || order.vehicle.images?.[0]?.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={order.vehicle.thumbnail || order.vehicle.images?.[0]?.imageUrl}
                    alt={`${order.vehicle.brand} ${order.vehicle.model}`}
                    className="h-16 w-24 rounded-lg object-cover bg-slate-100"
                  />
                ) : (
                  <div className="flex h-16 w-24 items-center justify-center rounded-lg bg-slate-100 text-[10px] text-muted">
                    No image
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-primary">{order.vehicle.brand} {order.vehicle.model}</h4>
                  <p className="text-xs text-secondary mt-0.5">Reg No: {order.vehicle.registrationNumber} | Fuel: {order.vehicle.fuelType}</p>
                  <p className="text-xs text-secondary">Hourly: {formatCurrency(order.vehicle.rentPerHour)} | Daily: {formatCurrency(order.vehicle.rentPerDay)}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-secondary mt-3">No vehicle details linked.</p>
            )}
          </div>

          {/* Pickup Verification Module */}
          {order.orderStatus === 'Confirmed' && !order.pickupStatus ? (
            <div className="surface-card p-5 sm:p-6 border-l-4 border-accent space-y-4">
              <div className="flex gap-2 items-center text-accent">
                <Key size={18} />
                <h3 className="font-semibold text-primary text-base">OTP Verification & Pickup Handover</h3>
              </div>
              <p className="text-xs text-secondary leading-normal">
                Ask the customer for the 4-digit verification code. Verifying OTP activates the lease and registers the handover.
              </p>
              <div className="flex gap-3 max-w-sm">
                <Input
                  placeholder="Enter 4-Digit OTP"
                  type="text"
                  maxLength={4}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                />
                <Button onClick={handleVerifyPickup} loading={busy}>Verify & Handover</Button>
              </div>
              <p className="text-[11px] text-muted">
                Demo OTP: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded font-bold text-accent">{order.pickupOtp}</span>
              </p>
            </div>
          ) : null}

          {/* Return Inspection Form Module */}
          {order.orderStatus === 'Active' && order.pickupStatus ? (
            <div className="surface-card p-5 sm:p-6 border-l-4 border-emerald-500 space-y-4">
              <div className="flex gap-2 items-center text-emerald-600">
                <CheckCircle2 size={18} />
                <h3 className="font-semibold text-primary text-base">Return Inspection & Closure</h3>
              </div>
              <p className="text-xs text-secondary">
                Perform vehicle return inspection checks. Set the return condition and enter penalties if damages or delays occurred.
              </p>
              <div className="grid gap-4 sm:grid-cols-2 mt-2">
                <Select
                  label="Condition"
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value)}
                  options={[
                    { value: 'Good', label: 'Good (No damage)' },
                    { value: 'Damaged', label: 'Damaged (Penalty applies)' }
                  ]}
                />
                <Input
                  label="Penalty Fee (INR)"
                  type="number"
                  value={penaltyAmount}
                  onChange={(e) => setPenaltyAmount(e.target.value)}
                />
                <Input
                  label="Penalty Reason"
                  placeholder="e.g., Scratched door panel, delayed return"
                  className="sm:col-span-2"
                  value={penaltyReason}
                  onChange={(e) => setPenaltyReason(e.target.value)}
                />
                <Textarea
                  label="Inspection Remarks"
                  className="sm:col-span-2"
                  value={returnRemarks}
                  onChange={(e) => setReturnRemarks(e.target.value)}
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={handleCompleteReturn} loading={busy}>Finalize Return & Generate Invoice</Button>
              </div>
            </div>
          ) : null}

          {/* Invoice Receipt Receipt */}
          {order.invoice ? (
            <InfoCard title="Invoice Receipt">
              <div className="flex gap-2 items-center text-emerald-600 mb-3">
                <FileCheck size={18} />
                <span className="text-sm font-semibold text-primary">Generated Invoice: {order.invoice.invoiceNumber}</span>
              </div>
              <dl>
                <InfoRow label="Base Rent" value={formatCurrency(order.invoice.rentalAmount)} />
                <InfoRow label="Tax Amount (18%)" value={formatCurrency(order.invoice.taxAmount)} />
                <InfoRow label="Security Deposit" value={formatCurrency(order.invoice.depositAmount)} />
                <InfoRow label="Penalty / Late Fees" value={formatCurrency(order.invoice.penaltyAmount)} />
                <InfoRow label="Invoice Status" value={<StatusBadge status={order.invoice.invoiceStatus} />} />
                <div className="border-t border-border mt-3 pt-3 flex justify-between items-center">
                  <span className="text-sm font-bold text-primary">Final Total Charged</span>
                  <span className="text-base font-bold text-accent">{formatCurrency(order.invoice.totalAmount)}</span>
                </div>
              </dl>
            </InfoCard>
          ) : null}

          {/* Remarks Notes */}
          <InfoCard title="Remarks & Rental Notes">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-secondary">
              {order.remarks || 'No remarks provided.'}
            </p>
          </InfoCard>
          </>
          ) : (
            <div className="space-y-6">
              {/* Customer Verification Details Card */}
              <InfoCard title="Customer Profile & Verification">
                <dl className="mb-4">
                  <InfoRow label="Full Name" value={customerName(order.customer)} />
                  <InfoRow label="Email Address" value={order.customer?.email || '—'} />
                  <InfoRow label="Phone Number" value={order.customer?.phone || '—'} />
                  <InfoRow label="Verification Status" value={
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${order.customer?.isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {order.customer?.isVerified ? 'Verified Profile' : 'Pending Verification'}
                    </span>
                  } />
                </dl>

                <div className="border-t border-border pt-4">
                  <h4 className="text-xs font-bold text-primary uppercase mb-3">Driving License Details</h4>
                  <dl className="mb-4">
                    <InfoRow label="License Number" value={order.customer?.drivingLicenseNo || <span className="text-danger font-medium">Not provided</span>} />
                  </dl>

                  {order.customer?.drivingLicenseImage ? (
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-secondary">Driving License Copy:</span>
                      <div className="relative h-64 w-full overflow-hidden rounded-xl border border-border bg-slate-50">
                        <img
                          src={order.customer.drivingLicenseImage}
                          alt="Driving License Copy"
                          className="h-full w-full object-contain"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-rose-500 bg-rose-50/30">
                      ⚠️ No driving license copy image uploaded by user.
                    </div>
                  )}

                  {!order.customer?.isVerified && order.customer?.drivingLicenseNo && (
                    <div className="mt-5 border-t border-border pt-4 flex justify-end">
                      <Button
                        onClick={handleVerifyCustomer}
                        loading={verifyingCustomer}
                      >
                        Approve & Verify Driving License
                      </Button>
                    </div>
                  )}
                </div>
              </InfoCard>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Pricing Breakdown Card */}
          <InfoCard title="Lease Pricing Details">
            <dl className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-secondary">Base Rental Cost</span>
                <span className="font-medium text-primary tabular-nums">{formatCurrency(order.rentalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-secondary">GST / Taxes (18%)</span>
                <span className="font-medium text-primary tabular-nums">{formatCurrency(Number(order.rentalAmount) * 0.18)}</span>
              </div>
              <div className="flex justify-between text-sm border-b border-border pb-2">
                <span className="text-secondary">Refundable Security Deposit</span>
                <span className="font-medium text-primary tabular-nums">{formatCurrency(order.securityDeposit?.depositAmount || 0)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-1">
                <span className="text-primary">Estimated Grand Total</span>
                <span className="text-accent tabular-nums">{formatCurrency(Number(order.rentalAmount) * 1.18 + Number(order.securityDeposit?.depositAmount || 0))}</span>
              </div>
            </dl>
          </InfoCard>

          {/* Security Deposit Details Card */}
          {order.securityDeposit ? (
            <InfoCard title="Security Deposit Refund status">
              <dl className="space-y-2">
                <InfoRow label="Deposit Status" value={<span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${order.securityDeposit.depositStatus === 'Held' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{order.securityDeposit.depositStatus}</span>} />
                <InfoRow label="Collected Amount" value={formatCurrency(order.securityDeposit.depositAmount)} />
                <InfoRow label="Penalty Deducted" value={formatCurrency(order.securityDeposit.penaltyAmount || 0)} />
                {order.securityDeposit.penaltyReason && (
                  <div className="text-xs text-rose-600 bg-rose-50 p-2 rounded border border-rose-100 leading-normal">
                    Reason: {order.securityDeposit.penaltyReason}
                  </div>
                )}
                <InfoRow label="Refunded Amount" value={formatCurrency(order.securityDeposit.refundAmount || 0)} />
                <InfoRow label="Refund Status" value={<StatusBadge status={order.securityDeposit.refundStatus} />} />
                {order.securityDeposit.refundDate && (
                  <InfoRow label="Refund Date" value={formatDateTime(order.securityDeposit.refundDate)} />
                )}
                {order.securityDeposit.refundMethod && (
                  <InfoRow label="Refund Method" value={order.securityDeposit.refundMethod} />
                )}
                {order.securityDeposit.remarks && (
                  <div className="text-xs bg-slate-50 p-2 rounded border border-border leading-normal">
                    Refund Remarks/UTR: {order.securityDeposit.remarks}
                  </div>
                )}

                {order.securityDeposit.depositStatus === 'Released' && order.securityDeposit.refundStatus === 'Pending' && (
                  <div className="mt-4 border-t border-border pt-4 space-y-3">
                    <h4 className="text-xs font-bold text-primary uppercase">Process Manual Deposit Refund</h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Select
                        label="Refund Method"
                        value={refundMethod}
                        onChange={(e) => setRefundMethod(e.target.value)}
                        options={[
                          { value: 'UPI', label: 'UPI' },
                          { value: 'Cash', label: 'Cash' },
                          { value: 'Bank_Transfer', label: 'Bank Transfer' },
                        ]}
                      />
                      <Input
                        label="Refund UTR / Reference"
                        placeholder="e.g. UTR Ref or Cash details"
                        value={refundRef}
                        onChange={(e) => setRefundRef(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        size="xs"
                        onClick={handleProcessRefund}
                        loading={refunding}
                      >
                        Process Refund
                      </Button>
                    </div>
                  </div>
                )}
              </dl>
            </InfoCard>
          ) : null}

          {/* Print Options */}
          <InfoCard title="Print Summary">
            <p className="text-xs text-secondary leading-relaxed">
              Export and download a summary statement of this rental order.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              onClick={() => window.print()}
            >
              <Printer size={14} />
              Print Invoice Summary
            </Button>
          </InfoCard>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        loading={busy}
        title={
          confirm?.type === 'confirm'
            ? 'Confirm rental booking?'
            : confirm?.type === 'cancel'
              ? 'Cancel rental booking?'
              : 'Delete rental booking?'
        }
        description={
          confirm?.type === 'confirm'
            ? `Please verify payment before confirming. Method: ${order.payment?.paymentMethod || 'None'}. Reference UTR ID: ${order.payment?.transactionId || 'None'}. Vehicle status will change to Reserved.`
            : confirm?.type === 'cancel'
              ? 'Vehicle availability status will be released back to Available.'
              : 'This permanently removes the booking from records.'
        }
        confirmLabel="Confirm"
        onConfirm={() => {
          if (confirm?.type === 'confirm') return runStatus('Confirmed');
          if (confirm?.type === 'cancel') return runStatus('Cancelled');
          return handleDelete();
        }}
      />
    </MasterPage>
  );
}
