'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarRange, Car, ArrowRight } from 'lucide-react';
import MasterPage from '@/components/master/MasterPage';
import SkeletonLoader from '@/components/common/SkeletonLoader';
import { APP_ROUTES } from '@/constants/routes';
import rentalService from '@/services/rentalService';
import { formatCurrency, formatDate } from '@/lib/format';
import { getErrorMessage } from '@/lib/apiResponse';
import notify from '@/lib/toast';

const TABS = [
  { key: '', label: 'All' },
  { key: 'Active', label: 'Active' },
  { key: 'Confirmed', label: 'Upcoming' },
  { key: 'Completed', label: 'Completed' },
  { key: 'Cancelled', label: 'Cancelled' },
];

const STATUS_STYLE = {
  Active: 'bg-emerald-100 text-emerald-700',
  Confirmed: 'bg-blue-100 text-blue-700',
  Pending: 'bg-amber-100 text-amber-700',
  Completed: 'bg-slate-100 text-slate-600',
  Cancelled: 'bg-rose-100 text-rose-700',
  Returned: 'bg-violet-100 text-violet-700',
};

const PAYMENT_STYLE = {
  Paid: 'bg-emerald-100 text-emerald-700',
  Pending: 'bg-amber-100 text-amber-700',
  Failed: 'bg-rose-100 text-rose-700',
};

export default function CustomerRentalsPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = { page: pg, limit: 10, sortBy: 'createdAt', order: 'desc' };
      if (activeTab) params.orderStatus = activeTab;
      const res = await rentalService.getRentalOrders(params);
      setOrders(res.data?.rentalOrders || []);
      setPagination(res.data?.pagination || { total: 0, totalPages: 1 });
      setPage(pg);
    } catch (err) {
      notify.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { load(1); }, [activeTab]);

  return (
    <MasterPage
      title="My Rentals"
      description={`${pagination.total} total booking${pagination.total !== 1 ? 's' : ''}`}
      breadcrumbs={[
        { label: 'Customer', href: APP_ROUTES.CUSTOMER.DASHBOARD },
        { label: 'My Rentals' },
      ]}
    >
      {/* Tabs */}
      <div className="mb-5 flex gap-1 overflow-x-auto rounded-2xl border border-border bg-surface p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => { setActiveTab(tab.key); }}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition
              ${activeTab === tab.key
                ? 'bg-accent text-white shadow-sm'
                : 'text-muted hover:bg-muted/5 hover:text-primary'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <SkeletonLoader key={i} height="6rem" rounded="2xl" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="surface-card py-16 text-center">
          <CalendarRange size={44} className="mx-auto mb-4 text-muted/30" />
          <p className="text-sm font-semibold text-muted">No rentals found</p>
          <p className="text-xs text-muted/60 mt-1">
            {activeTab ? `No ${activeTab.toLowerCase()} rentals.` : 'Book your first vehicle to get started.'}
          </p>
          {!activeTab && (
            <Link
              href={APP_ROUTES.CUSTOMER.VEHICLES}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90"
            >
              <Car size={14} /> Browse Cars
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={APP_ROUTES.CUSTOMER.RENTAL_DETAIL(order.id)}
              className="surface-card flex items-center gap-4 p-4 transition hover:shadow-md hover:border-accent/30"
            >
              {/* Vehicle thumbnail or icon */}
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                {order.vehicle?.images?.[0]?.imageUrl ? (
                  <img src={order.vehicle.images[0].imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Car size={24} className="text-muted/40" />
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-primary text-sm truncate">
                  {order.vehicle ? `${order.vehicle.brand} ${order.vehicle.model}` : 'Vehicle'}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  #{order.orderNumber || order.id?.slice(0, 8)}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  {formatDate(order.pickupDate)} → {formatDate(order.expectedReturnDate)}
                </p>
              </div>

              {/* Status + Amount */}
              <div className="shrink-0 text-right space-y-1.5">
                <span className={`block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[order.orderStatus] || 'bg-slate-100 text-slate-600'}`}>
                  {order.orderStatus}
                </span>
                <span className="block text-sm font-bold text-primary tabular-nums">
                  {formatCurrency(order.rentalAmount)}
                </span>
              </div>

              <ArrowRight size={16} className="shrink-0 text-muted" />
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => load(p)}
              className={`h-9 w-9 rounded-xl text-sm font-semibold transition
                ${p === page
                  ? 'bg-accent text-white'
                  : 'border border-border text-muted hover:border-accent hover:text-accent'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </MasterPage>
  );
}
