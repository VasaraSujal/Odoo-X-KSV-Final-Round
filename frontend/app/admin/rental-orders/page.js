'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, Pencil, Ban, Trash2 } from 'lucide-react';
import MasterPage from '@/components/master/MasterPage';
import DataTable from '@/components/tables/DataTable';
import FilterPanel from '@/components/forms/FilterPanel';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Button from '@/components/ui/Button';
import ErrorState from '@/components/dashboard/ErrorState';
import StatusBadge from '@/components/dashboard/StatusBadge';
import rentalService from '@/services/rentalService';
import { APP_ROUTES } from '@/constants/routes';
import { RENTAL_STATUS_OPTIONS } from '@/lib/rental';
import { customerName, formatCurrency, formatDate } from '@/lib/format';
import { getErrorMessage } from '@/lib/apiResponse';
import notify from '@/lib/toast';

const EMPTY_FILTERS = {
  orderNumber: '',
  customerName: '',
  status: '',
  pickupDate: '',
  returnDate: '',
};

export default function RentalOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionTarget, setActionTarget] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy,
        order: sortOrder,
      };
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });
      const result = await rentalService.getRentalOrders(params);
      setOrders(result.data?.orders || []);
      setPagination((prev) => ({ ...prev, ...(result.data?.pagination || {}) }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit, sortBy, sortOrder]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAction() {
    if (!actionTarget) return;
    setActionBusy(true);
    try {
      if (actionTarget.type === 'cancel') {
        await rentalService.updateStatus(actionTarget.order.id, 'CANCELLED');
        notify.success('Rental cancelled');
      } else if (actionTarget.type === 'delete') {
        await rentalService.remove(actionTarget.order.id);
        notify.success('Rental deleted');
      }
      setActionTarget(null);
      load();
    } catch (err) {
      notify.error(getErrorMessage(err));
    } finally {
      setActionBusy(false);
    }
  }

  const columns = [
    {
      key: 'bookingNumber',
      header: 'Booking',
      sortable: true,
      render: (v, row) => (
        <div>
          <p className="font-medium text-primary">{v}</p>
          <p className="text-[11px] text-muted">{formatDate(row.createdAt)}</p>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (_, row) => customerName(row.customer),
    },
    {
      key: 'status',
      header: 'Status',
      render: (v) => <StatusBadge status={v} />,
    },
    {
      key: 'pickupDate',
      header: 'Pickup',
      sortable: true,
      render: (v) => formatDate(v),
    },
    {
      key: 'expectedReturnDate',
      header: 'Return',
      render: (v) => formatDate(v),
    },
    {
      key: 'grandTotal',
      header: 'Total',
      sortable: true,
      render: (v) => (
        <span className="font-medium tabular-nums">{formatCurrency(v)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <Link href={APP_ROUTES.ADMIN.RENTAL_ORDER_DETAIL(row.id)}>
            <Button variant="ghost" size="sm" aria-label="View">
              <Eye size={14} />
            </Button>
          </Link>
          {row.status === 'PENDING' ? (
            <Link href={APP_ROUTES.ADMIN.RENTAL_ORDER_EDIT(row.id)}>
              <Button variant="ghost" size="sm" aria-label="Edit">
                <Pencil size={14} />
              </Button>
            </Link>
          ) : null}
          {row.status !== 'CANCELLED' &&
          row.status !== 'COMPLETED' &&
          row.status !== 'LATE' ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-warning"
              aria-label="Cancel"
              onClick={() => setActionTarget({ type: 'cancel', order: row })}
            >
              <Ban size={14} />
            </Button>
          ) : null}
          {row.status === 'PENDING' || row.status === 'CANCELLED' ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-danger"
              aria-label="Delete"
              onClick={() => setActionTarget({ type: 'delete', order: row })}
            >
              <Trash2 size={14} />
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  if (error && !orders.length && !loading) {
    return (
      <MasterPage
        title="Rental Orders"
        breadcrumbs={[
          { label: 'Admin', href: APP_ROUTES.ADMIN.ROOT },
          { label: 'Rental Orders' },
        ]}
      >
        <div className="surface-card">
          <ErrorState description={error} onRetry={load} />
        </div>
      </MasterPage>
    );
  }

  return (
    <MasterPage
      title="Rental Orders"
      description="Track fleet bookings end-to-end"
      breadcrumbs={[
        { label: 'Admin', href: APP_ROUTES.ADMIN.ROOT },
        { label: 'Rental Orders' },
      ]}
    >
      <div className="mb-4">
        <FilterPanel
          values={filters}
          onChange={(key, value) => {
            setFilters((prev) => ({ ...prev, [key]: value }));
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          onReset={() => {
            setFilters(EMPTY_FILTERS);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          filters={[
            { key: 'orderNumber', label: 'Booking #', placeholder: 'BKG-…' },
            { key: 'customerName', label: 'Customer', placeholder: 'Name' },
            {
              key: 'status',
              label: 'Status',
              type: 'select',
              options: RENTAL_STATUS_OPTIONS,
            },
            { key: 'pickupDate', label: 'Pickup from', type: 'date' },
            { key: 'returnDate', label: 'Return until', type: 'date' },
          ]}
        />
      </div>

      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        searchable={false}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(key, order) => {
          setSortBy(key);
          setSortOrder(order);
        }}
        pagination={pagination}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
        emptyTitle="No rental orders"
        emptyDescription="Rental bookings will appear here once customers place orders."
      />

      <ConfirmDialog
        open={Boolean(actionTarget)}
        onClose={() => setActionTarget(null)}
        onConfirm={handleAction}
        loading={actionBusy}
        title={
          actionTarget?.type === 'cancel' ? 'Cancel rental?' : 'Delete rental?'
        }
        description={
          actionTarget?.type === 'cancel'
            ? `Cancel ${actionTarget.order.bookingNumber}? Reserved vehicles will be released.`
            : `Permanently delete ${actionTarget?.order?.bookingNumber}?`
        }
        confirmLabel={actionTarget?.type === 'cancel' ? 'Cancel Rental' : 'Delete'}
        tone="danger"
      />
    </MasterPage>
  );
}
