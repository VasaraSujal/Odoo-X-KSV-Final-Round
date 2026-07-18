'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Car, Heart, Star, Fuel, Settings2, Users, Gauge, Zap, ShieldCheck, CheckCircle, CalendarRange, Clock,
} from 'lucide-react';
import MasterPage from '@/components/master/MasterPage';
import PageLoader from '@/components/common/PageLoader';
import ErrorState from '@/components/dashboard/ErrorState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { APP_ROUTES } from '@/constants/routes';
import vehicleService from '@/services/vehicleService';
import rentalService from '@/services/rentalService';
import favouriteService from '@/services/favouriteService';
import { formatCurrency, formatDate } from '@/lib/format';
import { getErrorMessage } from '@/lib/apiResponse';
import notify from '@/lib/toast';

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

/** Convert a local date-only string "YYYY-MM-DD" to UTC ISO datetime "YYYY-MM-DDT00:00:00Z" */
function toISODateTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toISOString();
}

/** Calculate total hours between two date strings */
function hoursBetween(fromStr, toStr) {
  if (!fromStr || !toStr) return 0;
  const diff = new Date(toStr) - new Date(fromStr);
  return Math.max(1, Math.round(diff / (1000 * 60 * 60)));
}

/** Format number of hours into a readable label */
function formatDuration(hours) {
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''}`;
  const days = Math.floor(hours / 24);
  const rem = hours % 24;
  return rem > 0 ? `${days}d ${rem}h` : `${days} day${days !== 1 ? 's' : ''}`;
}

// ------------------------------------------------------------------
// Sub-components
// ------------------------------------------------------------------

function SpecItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10">
        <Icon size={16} className="text-accent" />
      </div>
      <div>
        <p className="text-[11px] text-muted uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-primary">{value || '—'}</p>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Page
// ------------------------------------------------------------------

export default function CustomerVehicleDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFav, setIsFav] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  // Booking form state
  const [pickupDate, setPickupDate] = useState('');       // YYYY-MM-DD
  const [returnDate, setReturnDate] = useState('');       // YYYY-MM-DD
  // pickupType must match backend enum exactly
  const [pickupType, setPickupType] = useState('Store_Pickup');
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI' | 'Card' | 'Cash'
  const [transactionId, setTransactionId] = useState('');
  const [booking, setBooking] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await vehicleService.getVehicleById(id);
      setVehicle(res.data);
      setIsFav(favouriteService.isFavourite(id));

      // Default: pickup tomorrow, return day after
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);
      setPickupDate(tomorrow.toISOString().split('T')[0]);
      setReturnDate(dayAfter.toISOString().split('T')[0]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  function toggleFav() {
    const nowFav = favouriteService.toggle(id);
    setIsFav(nowFav);
    notify.success(nowFav ? 'Added to favourites ❤️' : 'Removed from favourites');
  }

  // ------------------------------------------------------------------
  // Pricing calculation — base unit is HOURS
  // ------------------------------------------------------------------
  const totalHours = useMemo(() => hoursBetween(pickupDate, returnDate), [pickupDate, returnDate]);
  const rentPerHour = vehicle ? Number(vehicle.rentPerHour || 0) : 0;
  const rentalAmount = rentPerHour * totalHours;
  const securityDeposit = vehicle ? Number(vehicle.securityDeposit || 0) : 0;
  const totalPayable = rentalAmount + securityDeposit;

  // Derive rentalUnit and rentalDuration for backend
  const { rentalUnit, rentalDuration } = useMemo(() => {
    if (totalHours < 24) return { rentalUnit: 'Hour', rentalDuration: totalHours };
    const days = Math.ceil(totalHours / 24);
    if (days < 7)  return { rentalUnit: 'Day',  rentalDuration: days };
    const weeks = Math.ceil(days / 7);
    if (weeks < 4) return { rentalUnit: 'Week', rentalDuration: weeks };
    return { rentalUnit: 'Month', rentalDuration: Math.ceil(weeks / 4) };
  }, [totalHours]);

  // ------------------------------------------------------------------
  // Booking handler
  // ------------------------------------------------------------------
  async function handleBooking() {
    if (!pickupDate)  { notify.error('Please select a pickup date'); return; }
    if (!returnDate)  { notify.error('Please select a return date'); return; }
    if (new Date(returnDate) <= new Date(pickupDate)) {
      notify.error('Return date must be after pickup date'); return;
    }
    if (paymentMethod !== 'Cash' && !transactionId.trim()) {
      notify.error('Please enter the payment transaction reference ID'); return;
    }

    setBooking(true);
    try {
      const payload = {
        vehicleId: id,
        pickupType,                          // 'Store_Pickup' | 'Home_Delivery'
        pickupDate: toISODateTime(pickupDate),
        expectedReturnDate: toISODateTime(returnDate),
        rentalUnit,                          // derived from date diff
        rentalDuration,                      // derived from date diff
        paymentMethod,                       // 'Cash' | 'Card' | 'UPI'
        transactionId: paymentMethod === 'Cash' ? `CASH-${Date.now()}` : transactionId,
      };

      const res = await rentalService.create(payload);
      notify.success('Booking confirmed! 🎉');
      const orderId = res.data?.id || res.data?.rentalOrder?.id;
      router.push(APP_ROUTES.CUSTOMER.RENTAL_DETAIL(orderId));
    } catch (err) {
      notify.error(getErrorMessage(err));
    } finally {
      setBooking(false);
      setShowConfirm(false);
    }
  }

  // ------------------------------------------------------------------
  // Render guards
  // ------------------------------------------------------------------
  if (loading) return <PageLoader />;
  if (error || !vehicle) {
    return (
      <MasterPage title="Vehicle" backHref={APP_ROUTES.CUSTOMER.VEHICLES}>
        <ErrorState description={error || 'Vehicle not found'} onRetry={load} />
      </MasterPage>
    );
  }

  const images = vehicle.images || [];
  const primaryImage = images[activeImage]?.imageUrl;
  const today = new Date().toISOString().split('T')[0];

  return (
    <MasterPage
      title={`${vehicle.brand} ${vehicle.model}`}
      description={`${vehicle.year} · ${vehicle.fuelType} · ${vehicle.transmission}`}
      backHref={APP_ROUTES.CUSTOMER.VEHICLES}
      breadcrumbs={[
        { label: 'Customer', href: APP_ROUTES.CUSTOMER.DASHBOARD },
        { label: 'Browse Cars', href: APP_ROUTES.CUSTOMER.VEHICLES },
        { label: `${vehicle.brand} ${vehicle.model}` },
      ]}
    >
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        {/* ============ LEFT — Images + Specs ============ */}
        <div className="space-y-5">

          {/* Main Image */}
          <div className="surface-card overflow-hidden p-0">
            <div className="relative h-72 bg-slate-100 sm:h-96">
              {primaryImage ? (
                <img
                  src={primaryImage}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Car size={64} className="text-muted/30" />
                </div>
              )}
              {/* Status badge */}
              <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold
                ${vehicle.status === 'Available' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                {vehicle.status}
              </span>
              {/* Favourite button */}
              <button
                type="button"
                onClick={toggleFav}
                className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition
                  ${isFav ? 'bg-rose-500 text-white' : 'bg-white/90 text-slate-400 hover:text-rose-500'}`}
                aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
              >
                <Heart size={18} className={isFav ? 'fill-white' : ''} />
              </button>
            </div>
            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto p-3">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setActiveImage(idx)}
                    className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition
                      ${idx === activeImage ? 'border-accent' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={img.imageUrl} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Specs */}
          <div className="surface-card p-5">
            <h2 className="mb-4 text-sm font-semibold text-primary">Specifications</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <SpecItem icon={Fuel}      label="Fuel Type"     value={vehicle.fuelType} />
              <SpecItem icon={Settings2} label="Transmission"  value={vehicle.transmission} />
              <SpecItem icon={Users}     label="Seats"         value={vehicle.seatCapacity} />
              <SpecItem icon={Gauge}     label="Mileage"       value={vehicle.mileage ? `${vehicle.mileage} km/l` : '—'} />
              <SpecItem icon={Zap}       label="Engine"        value={vehicle.engineCapacity ? `${vehicle.engineCapacity} cc` : '—'} />
              <SpecItem icon={Car}       label="Odometer"      value={vehicle.currentOdometer ? `${vehicle.currentOdometer} km` : '—'} />
            </div>
          </div>

          {/* Pricing reference table */}
          <div className="surface-card p-5">
            <h2 className="mb-3 text-sm font-semibold text-primary">Reference Rates</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: 'Per Hour', value: vehicle.rentPerHour },
                { label: 'Per Day',  value: vehicle.rentPerDay  },
                { label: 'Per Week', value: vehicle.rentPerWeek },
                { label: 'Per Month',value: vehicle.rentPerMonth },
              ].map((r) => (
                <div key={r.label} className="rounded-xl border border-border p-3 text-center">
                  <p className="text-[11px] text-muted">{r.label}</p>
                  <p className="mt-0.5 font-bold text-primary text-sm tabular-nums">{formatCurrency(r.value)}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-muted">
              * Booking price is calculated at <strong>{formatCurrency(vehicle.rentPerHour)}/hour</strong> based on your selected dates.
            </p>
          </div>

          {/* Description */}
          {vehicle.description && (
            <div className="surface-card p-5">
              <h2 className="mb-2 text-sm font-semibold text-primary">About this vehicle</h2>
              <p className="text-sm leading-relaxed text-secondary">{vehicle.description}</p>
            </div>
          )}
        </div>

        {/* ============ RIGHT — Header + Booking Form ============ */}
        <div className="space-y-5">

          {/* Vehicle header card */}
          <div className="surface-card p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h1 className="text-xl font-bold text-primary">{vehicle.brand} {vehicle.model}</h1>
                <p className="text-sm text-muted">{vehicle.year} · {vehicle.category?.name || 'Vehicle'}</p>
              </div>
              <div className="flex items-center gap-1 text-amber-500">
                <Star size={14} className="fill-amber-500" />
                <span className="text-sm font-semibold">{Number(vehicle.averageRating || 0).toFixed(1)}</span>
                <span className="text-xs text-muted">({vehicle.totalRentals || 0} trips)</span>
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-accent tabular-nums">{formatCurrency(vehicle.rentPerHour)}</span>
              <span className="text-sm text-muted">/ hour</span>
            </div>
            <p className="text-xs text-muted mt-1">Reg: {vehicle.registrationNumber}</p>
          </div>

          {/* Booking Form */}
          {vehicle.status === 'Available' ? (
            <div className="surface-card p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-primary">
                <CalendarRange size={16} className="text-accent" />
                Book this Vehicle
              </h2>

              {/* From date */}
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-semibold text-muted uppercase tracking-wide">
                  Pickup Date
                </label>
                <input
                  type="date"
                  value={pickupDate}
                  min={today}
                  onChange={(e) => {
                    setPickupDate(e.target.value);
                    // Auto-push return date if it's before or equal to new pickup
                    if (returnDate && returnDate <= e.target.value) {
                      const next = new Date(e.target.value);
                      next.setDate(next.getDate() + 1);
                      setReturnDate(next.toISOString().split('T')[0]);
                    }
                  }}
                  className="input-field w-full"
                />
              </div>

              {/* To date */}
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-semibold text-muted uppercase tracking-wide">
                  Return Date
                </label>
                <input
                  type="date"
                  value={returnDate}
                  min={pickupDate || today}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="input-field w-full"
                />
              </div>

              {/* Duration pill */}
              {pickupDate && returnDate && new Date(returnDate) > new Date(pickupDate) && (
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-accent/5 border border-accent/20 px-4 py-2.5">
                  <Clock size={15} className="text-accent shrink-0" />
                  <p className="text-sm font-medium text-accent">
                    Duration: <strong>{formatDuration(totalHours)}</strong>
                    <span className="ml-2 text-xs font-normal text-muted">({totalHours} hours)</span>
                  </p>
                </div>
              )}

              {/* Pickup Type */}
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-semibold text-muted uppercase tracking-wide">
                  Pickup Type
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPickupType('Store_Pickup')}
                    className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition
                      ${pickupType === 'Store_Pickup' ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted hover:border-accent/50'}`}
                  >
                    🏢 Store Pickup
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickupType('Home_Delivery')}
                    className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition
                      ${pickupType === 'Home_Delivery' ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted hover:border-accent/50'}`}
                  >
                    🚚 Home Delivery
                  </button>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-semibold text-muted uppercase tracking-wide">
                  Payment Method
                </label>
                <div className="flex gap-2 mb-3">
                  {['UPI', 'Card', 'Cash'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(method);
                        setTransactionId('');
                      }}
                      className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition
                        ${paymentMethod === method ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted hover:border-accent/50'}`}
                    >
                      {method === 'UPI' ? '📱 UPI' : method === 'Card' ? '💳 Card' : '💵 Cash'}
                    </button>
                  ))}
                </div>

                {/* UPI QR Payment */}
                {paymentMethod === 'UPI' && (
                  <div className="rounded-xl border border-border p-3 bg-slate-50 space-y-3">
                    <div className="text-center space-y-1.5">
                      <p className="text-[11px] font-semibold text-muted uppercase">Scan & Pay ₹{totalPayable}</p>
                      {/* Modern CSS QR Code Mock */}
                      <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-xl bg-white border border-border p-2">
                        <div className="h-full w-full bg-[linear-gradient(45deg,#111_25%,transparent_25%),linear-gradient(-45deg,#111_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#111_75%),linear-gradient(-45deg,transparent_75%,#111_75%)] bg-[size:10px_10px] opacity-75" />
                      </div>
                      <p className="text-[10px] text-muted leading-tight">Please scan the QR code using any UPI app (GPay/PhonePe/Paytm) to complete payment.</p>
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold text-muted uppercase">UTR/Transaction Reference ID</label>
                      <input
                        type="text"
                        placeholder="e.g. 12-digit UPI reference number"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className="input-field w-full text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Card Payment */}
                {paymentMethod === 'Card' && (
                  <div className="rounded-xl border border-border p-3 bg-slate-50 space-y-3">
                    <p className="text-[10px] font-semibold text-muted uppercase">Enter Card Details</p>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Card Number (16-digit)"
                        maxLength={16}
                        className="input-field w-full text-xs"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="MM/YY"
                          maxLength={5}
                          className="input-field w-1/2 text-xs"
                        />
                        <input
                          type="password"
                          placeholder="CVV"
                          maxLength={3}
                          className="input-field w-1/2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-semibold text-muted uppercase">Payment Transaction ID</label>
                        <input
                          type="text"
                          placeholder="Reference number or card holder name"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          className="input-field w-full text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Cash payment info */}
                {paymentMethod === 'Cash' && (
                  <div className="rounded-xl border border-border p-3 bg-slate-50">
                    <p className="text-[11px] font-semibold text-amber-700">💵 Pay on Handover</p>
                    <p className="text-[10px] text-muted mt-1 leading-tight">
                      You can pay the total amount of ₹{totalPayable} in cash directly to our executive at the time of pickup or delivery.
                    </p>
                  </div>
                )}
              </div>

              {/* Price Summary */}
              <div className="mb-4 rounded-xl border border-border bg-slate-50 p-3 space-y-1.5">
                <div className="flex justify-between text-xs text-muted">
                  <span>{totalHours} hours × {formatCurrency(rentPerHour)}/hr</span>
                  <span className="font-semibold text-primary tabular-nums">{formatCurrency(rentalAmount)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted">
                  <span>Security Deposit</span>
                  <span className="font-semibold text-primary tabular-nums">{formatCurrency(securityDeposit)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-sm font-bold text-primary">
                  <span>Total Payable</span>
                  <span className="tabular-nums text-accent">{formatCurrency(totalPayable)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!pickupDate) { notify.error('Select a pickup date'); return; }
                  if (!returnDate) { notify.error('Select a return date'); return; }
                  if (new Date(returnDate) <= new Date(pickupDate)) {
                    notify.error('Return date must be after pickup date'); return;
                  }
                  setShowConfirm(true);
                }}
                className="w-full rounded-xl bg-accent py-3 text-sm font-bold text-white transition hover:bg-accent/90 active:scale-95"
              >
                Confirm Booking
              </button>
            </div>
          ) : (
            <div className="surface-card p-5 text-center">
              <Car size={32} className="mx-auto mb-2 text-muted/40" />
              <p className="text-sm font-medium text-muted">Not available for booking</p>
              <p className="text-xs text-muted/60 mt-1">
                This vehicle is currently {vehicle.status.toLowerCase()}.
              </p>
            </div>
          )}

          {/* Security info */}
          <div className="surface-card p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-500" />
              <div>
                <p className="text-xs font-semibold text-primary">Secure Booking</p>
                <p className="text-xs text-muted mt-0.5">
                  Your deposit is refunded upon safe vehicle return. OTP-verified pickup process.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleBooking}
        loading={booking}
        title="Confirm Booking"
        description={`Book ${vehicle.brand} ${vehicle.model} from ${formatDate(pickupDate)} to ${formatDate(returnDate)} (${formatDuration(totalHours)})? Total payable: ${formatCurrency(totalPayable)}`}
        confirmLabel="Yes, Book Now"
        tone="accent"
      />
    </MasterPage>
  );
}
