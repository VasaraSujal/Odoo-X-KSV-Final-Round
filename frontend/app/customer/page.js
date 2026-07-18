'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Car,
  CalendarRange,
  CreditCard,
  Clock,
  CheckCircle,
  ArrowRight,
  Heart,
} from 'lucide-react';
import MasterPage from '@/components/master/MasterPage';
import SkeletonLoader from '@/components/common/SkeletonLoader';
import { APP_ROUTES } from '@/constants/routes';
import rentalService from '@/services/rentalService';
import paymentService from '@/services/paymentService';
import { formatCurrency, formatDate, customerName } from '@/lib/format';
import { getErrorMessage } from '@/lib/apiResponse';

function StatCard({ icon: Icon, label, value, tone = 'accent', href, loading }) {
  const toneClasses = {
    accent: 'bg-accent/10 text-accent',
    success: 'bg-emerald-500/10 text-emerald-600',
    warning: 'bg-amber-500/10 text-amber-600',
    danger: 'bg-rose-500/10 text-rose-600',
  };

  const card = (
    <div className="surface-card flex items-center gap-4 p-5 transition hover:shadow-md">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${toneClasses[tone]}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted uppercase tracking-wide">{label}</p>
        {loading ? (
          <SkeletonLoader height="1.5rem" width="60%" rounded="lg" />
        ) : (
          <p className="mt-0.5 text-2xl font-bold text-primary">{value}</p>
        )}
      </div>
      {href && <ArrowRight size={16} className="shrink-0 text-muted" />}
    </div>
  );

  return href ? <Link href={href}>{card}</Link> : card;
}

function RentalCard({ order }) {
  const statusColor = {
    Active: 'bg-emerald-100 text-emerald-700',
    Confirmed: 'bg-blue-100 text-blue-700',
    Completed: 'bg-slate-100 text-slate-600',
    Cancelled: 'bg-rose-100 text-rose-700',
    Pending: 'bg-amber-100 text-amber-700',
  };

  return (
    <Link
      href={APP_ROUTES.CUSTOMER.RENTAL_DETAIL(order.id)}
      className="surface-card flex items-center gap-4 p-4 transition hover:shadow-md"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/10">
        <Car size={20} className="text-accent" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-primary text-sm truncate">
          {order.vehicle
            ? `${order.vehicle.brand} ${order.vehicle.model}`
            : order.orderNumber || order.id?.slice(0, 8)}
        </p>
        <p className="text-xs text-muted mt-0.5">
          {formatDate(order.pickupDate)} → {formatDate(order.expectedReturnDate)}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusColor[order.orderStatus] || 'bg-slate-100 text-slate-600'}`}>
          {order.orderStatus}
        </span>
        <p className="mt-1 text-xs font-semibold text-primary tabular-nums">
          {formatCurrency(order.rentalAmount)}
        </p>
      </div>
    </Link>
  );
}

export default function CustomerDashboardPage() {
  const [stats, setStats] = useState({ active: 0, upcoming: 0, completed: 0, pendingPayment: 0 });
  const [recentRentals, setRecentRentals] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [all, pending] = await Promise.all([
        rentalService.getRentalOrders({ limit: 100 }),
        paymentService.getPayments({ paymentStatus: 'Pending', limit: 100 }),
      ]);

      const orders = all.data?.rentalOrders || [];
      setStats({
        active: orders.filter((o) => o.orderStatus === 'Active').length,
        upcoming: orders.filter((o) => o.orderStatus === 'Confirmed').length,
        completed: orders.filter((o) => o.orderStatus === 'Completed').length,
        pendingPayment: pending.data?.payments?.length || 0,
      });
      setRecentRentals(orders.slice(0, 5));
    } catch (err) {
      console.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <MasterPage
      title="My Dashboard"
      description="Welcome back — here's a summary of your rentals"
      breadcrumbs={[{ label: 'Customer' }, { label: 'Dashboard' }]}
    >
      {/* Stats Grid */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Car}
          label="Active Rental"
          value={stats.active}
          tone="success"
          href={stats.active ? APP_ROUTES.CUSTOMER.RENTALS : undefined}
          loading={loading}
        />
        <StatCard
          icon={CalendarRange}
          label="Upcoming"
          value={stats.upcoming}
          tone="accent"
          href={APP_ROUTES.CUSTOMER.RENTALS}
          loading={loading}
        />
        <StatCard
          icon={CheckCircle}
          label="Completed"
          value={stats.completed}
          tone="warning"
          href={APP_ROUTES.CUSTOMER.RENTALS}
          loading={loading}
        />
        <StatCard
          icon={CreditCard}
          label="Pending Payments"
          value={stats.pendingPayment}
          tone="danger"
          href={APP_ROUTES.CUSTOMER.PAYMENTS}
          loading={loading}
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Link
          href={APP_ROUTES.CUSTOMER.VEHICLES}
          className="surface-card flex items-center gap-3 p-4 transition hover:shadow-md hover:border-accent"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10">
            <Car size={18} className="text-accent" />
          </div>
          <div>
            <p className="font-semibold text-sm text-primary">Browse Cars</p>
            <p className="text-xs text-muted">Explore available vehicles</p>
          </div>
        </Link>
        <Link
          href={APP_ROUTES.CUSTOMER.FAVOURITES}
          className="surface-card flex items-center gap-3 p-4 transition hover:shadow-md hover:border-accent"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50">
            <Heart size={18} className="text-rose-500" />
          </div>
          <div>
            <p className="font-semibold text-sm text-primary">Favourites</p>
            <p className="text-xs text-muted">Your saved vehicles</p>
          </div>
        </Link>
        <Link
          href={APP_ROUTES.CUSTOMER.RENTALS}
          className="surface-card flex items-center gap-3 p-4 transition hover:shadow-md hover:border-accent"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50">
            <Clock size={18} className="text-violet-500" />
          </div>
          <div>
            <p className="font-semibold text-sm text-primary">My Rentals</p>
            <p className="text-xs text-muted">Track your bookings</p>
          </div>
        </Link>
      </div>

      {/* Recent Rentals */}
      <div className="surface-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-primary">Recent Rentals</h2>
          <Link href={APP_ROUTES.CUSTOMER.RENTALS} className="text-xs font-semibold text-accent hover:underline">
            View all
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <SkeletonLoader key={i} height="4rem" rounded="xl" />)}
          </div>
        ) : recentRentals.length === 0 ? (
          <div className="py-10 text-center">
            <Car size={36} className="mx-auto mb-3 text-muted/40" />
            <p className="text-sm font-medium text-muted">No rentals yet</p>
            <p className="mt-1 text-xs text-muted/60">Start by browsing our available vehicles.</p>
            <Link
              href={APP_ROUTES.CUSTOMER.VEHICLES}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90"
            >
              Browse Cars <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentRentals.map((order) => (
              <RentalCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </MasterPage>
  );
}
