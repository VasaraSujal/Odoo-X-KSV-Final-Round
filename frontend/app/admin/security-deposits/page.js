'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Eye, Plus, RefreshCcw, Undo2 } from 'lucide-react';
import MasterPage from '@/components/master/MasterPage';
import DataTable from '@/components/tables/DataTable';
import FilterPanel from '@/components/forms/FilterPanel';
import Button from '@/components/ui/Button';
import ErrorState from '@/components/dashboard/ErrorState';
import FinancialStatsCard from '@/components/finance/FinancialStatsCard';
import PaymentStatusBadge from '@/components/finance/PaymentStatusBadge';
import securityDepositService from '@/services/securityDepositService';
import { APP_ROUTES } from '@/constants/routes';
import { DEPOSIT_STATUS_OPTIONS, remainingDeposit } from '@/lib/finance';
import { customerName, formatCurrency, formatDate } from '@/lib/format';
import { getErrorMessage } from '@/lib/apiResponse';

const EMPTY_FILTERS = {
  orderNumber: '',
  refundStatus: '',
};

export default function SecurityDepositsPage() {
  const [deposits, setDeposits] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });
      const result = await securityDepositService.getDeposits(params);
      setDeposits(result.data?.deposits || []);
      setPagination((prev) => ({ ...prev, ...(result.data?.pagination || {}) }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const collected = deposits.reduce(
      (sum, d) => sum + Number(d.depositAmount || 0),
      0
    );
    const refunded = deposits.reduce(
      (sum, d) => sum + Number(d.refundAmount || 0),
      0
    );
    const held = deposits.reduce((sum, d) => sum + remainingDeposit(d), 0);
    return { collected, refunded, held, count: pagination.total };
  }, [deposits, pagination.total]);

  const columns = [
    {
      key: 'booking',
      header: 'Rental',
      render: (_, row) => (
        <div>
          <p className="font-medium text-primary">
            {row.order?.orderNumber || '—'}
          </p>
          <p className="text-[11px] text-muted">
            {customerName(row.order?.customer || row.customer)}
          </p>
        </div>
      ),
    },
    {
      key: 'depositAmount',
      header: 'Collected',
      render: (v) => (
        <span className="font-semibold tabular-nums">{formatCurrency(v)}</span>
      ),
    },
    {
      key: 'refundAmount',
      header: 'Refunded',
      render: (v) => formatCurrency(v),
    },
    {
      key: 'remaining',
      header: 'Remaining',
      render: (_, row) => (
        <span className="font-medium tabular-nums text-accent">
          {formatCurrency(remainingDeposit(row))}
        </span>
      ),
    },
    {
      key: 'refundStatus',
      header: 'Status',
      render: (v) => <PaymentStatusBadge status={v} />,
    },
    {
      key: 'createdAt',
      header: 'Collected on',
      render: (v) => formatDate(v),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <Link href={APP_ROUTES.ADMIN.SECURITY_DEPOSIT_DETAIL(row.id)}>
            <Button variant="ghost" size="sm" aria-label="View deposit">
              <Eye size={14} />
            </Button>
          </Link>
          {String(row.refundStatus || '').toUpperCase() !== 'REFUNDED' && row.depositStatus === 'Released' ? (
            <Link href={APP_ROUTES.ADMIN.SECURITY_DEPOSIT_REFUND(row.id)}>
              <Button variant="ghost" size="sm" aria-label="Refund deposit">
                <Undo2 size={14} />
              </Button>
            </Link>
          ) : null}
        </div>
      ),
    },
  ];

  if (error && !deposits.length && !loading) {
    return (
      <MasterPage
        title="Security Deposits"
        breadcrumbs={[
          { label: 'Admin', href: APP_ROUTES.ADMIN.ROOT },
          { label: 'Security Deposits' },
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
      title="Security Deposits"
      description="Collect, hold, and refund rental security deposits"
      breadcrumbs={[
        { label: 'Admin', href: APP_ROUTES.ADMIN.ROOT },
        { label: 'Security Deposits' },
      ]}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={load} aria-label="Refresh">
            <RefreshCcw size={14} />
          </Button>
          <Link href={APP_ROUTES.ADMIN.SECURITY_DEPOSIT_NEW}>
            <Button size="sm">
              <Plus size={14} />
              Collect Deposit
            </Button>
          </Link>
        </div>
      }
    >
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <FinancialStatsCard
          title="Total deposits"
          value={stats.count}
          description="Matching filters"
          tone="accent"
          loading={loading}
        />
        <FinancialStatsCard
          title="Collected (page)"
          value={stats.collected}
          format="currency"
          tone="secondary"
          loading={loading}
        />
        <FinancialStatsCard
          title="Held (page)"
          value={stats.held}
          format="currency"
          tone="warning"
          loading={loading}
        />
        <FinancialStatsCard
          title="Refunded (page)"
          value={stats.refunded}
          format="currency"
          tone="success"
          loading={loading}
        />
      </div>

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
            {
              key: 'refundStatus',
              label: 'Status',
              type: 'select',
              options: DEPOSIT_STATUS_OPTIONS,
            },
          ]}
        />
      </div>

      <DataTable
        columns={columns}
        data={deposits}
        loading={loading}
        searchable={false}
        pagination={pagination}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
        emptyTitle="No security deposits"
        emptyDescription="Collect a deposit against a rental order to get started."
      />
    </MasterPage>
  );
}
