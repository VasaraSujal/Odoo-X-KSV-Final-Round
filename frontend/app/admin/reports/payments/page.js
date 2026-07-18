'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CreditCard, CircleCheck, CircleAlert, IndianRupee } from 'lucide-react';
import MasterPage from '@/components/master/MasterPage';
import FilterPanel from '@/components/forms/FilterPanel';
import DataTable from '@/components/tables/DataTable';
import ChartCard from '@/components/dashboard/ChartCard';
import ErrorState from '@/components/dashboard/ErrorState';
import PaymentStatusBadge from '@/components/finance/PaymentStatusBadge';
import ReportStatCards from '@/components/reports/ReportStatCards';
import ReportExportBar from '@/components/reports/ReportExportBar';
import { AreaChart, PieChart } from '@/components/charts';
import paymentService from '@/services/paymentService';
import useReportExport from '@/hooks/useReportExport';
import { APP_ROUTES } from '@/constants/routes';
import { PAYMENT_STATUS_OPTIONS } from '@/lib/finance';
import { formatCurrency, formatDateTime, toNumber } from '@/lib/format';
import {
  filterPaymentsClient,
  summarizeRevenue,
} from '@/lib/reports';
import { aggregatePaymentMethods } from '@/lib/format';
import { filterAndPaginate } from '@/lib/listUtils';
import { getErrorMessage } from '@/lib/apiResponse';

const EMPTY_FILTERS = {
  startDate: '',
  endDate: '',
  paymentStatus: '',
  search: '',
};

export default function PaymentReportPage() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [raw, setRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await paymentService.getPayments({ limit: 500 });
      const list = result.data?.payments || result.data || [];
      setRaw(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () => filterPaymentsClient(raw, filters),
    [raw, filters]
  );

  const successRows = useMemo(
    () => filtered.filter((p) => p.paymentStatus === 'SUCCESS'),
    [filtered]
  );

  const summary = useMemo(() => summarizeRevenue(successRows), [successRows]);
  const methodChart = useMemo(() => aggregatePaymentMethods(filtered), [filtered]);

  const pendingAmount = useMemo(
    () =>
      filtered
        .filter((p) => p.paymentStatus === 'PENDING')
        .reduce((sum, p) => sum + toNumber(p.amount), 0),
    [filtered]
  );

  const failedCount = useMemo(
    () => filtered.filter((p) => p.paymentStatus === 'FAILED').length,
    [filtered]
  );

  const { data, pagination } = useMemo(
    () =>
      filterAndPaginate(filtered, {
        page,
        limit: 10,
        sortBy,
        order: sortOrder,
      }),
    [filtered, page, sortBy, sortOrder]
  );

  const csvColumns = [
    { key: 'id', label: 'ID' },
    {
      key: 'booking',
      label: 'Booking',
      accessor: (row) => row.rentalOrder?.bookingNumber || '',
    },
    { key: 'paymentMethod', label: 'Method' },
    { key: 'paymentStatus', label: 'Status' },
    { key: 'amount', label: 'Amount' },
    {
      key: 'paidAt',
      label: 'Paid At',
      accessor: (row) => row.paidAt || row.createdAt || '',
    },
  ];

  const { exporting, exportFile } = useReportExport({
    exportType: 'payments',
    clientRows: filtered,
    clientColumns: csvColumns,
    clientFilename: 'payments-report.csv',
  });

  const columns = [
    {
      key: 'createdAt',
      header: 'Date',
      sortable: true,
      render: (v, row) => formatDateTime(row.paidAt || v),
    },
    {
      key: 'booking',
      header: 'Booking',
      render: (_, row) => row.rentalOrder?.bookingNumber || '—',
    },
    {
      key: 'paymentMethod',
      header: 'Method',
      sortable: true,
    },
    {
      key: 'paymentStatus',
      header: 'Status',
      sortable: true,
      render: (v) => <PaymentStatusBadge status={v} />,
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (v) => (
        <span className="font-semibold tabular-nums">{formatCurrency(v)}</span>
      ),
    },
  ];

  return (
    <MasterPage
      title="Payment Report"
      description="Payment statuses, methods, and settlement trends"
      backHref={APP_ROUTES.ADMIN.REPORTS}
      breadcrumbs={[
        { label: 'Admin', href: APP_ROUTES.ADMIN.ROOT },
        { label: 'Reports', href: APP_ROUTES.ADMIN.REPORTS },
        { label: 'Payments' },
      ]}
      actions={<ReportExportBar exporting={exporting} onExport={exportFile} disabled={loading} />}
    >
      <div className="space-y-4">
        <FilterPanel
          values={filters}
          onChange={(key, value) => {
            setPage(1);
            setFilters((prev) => ({ ...prev, [key]: value }));
          }}
          onReset={() => {
            setFilters(EMPTY_FILTERS);
            setPage(1);
          }}
          filters={[
            { key: 'startDate', label: 'Start date', type: 'date' },
            { key: 'endDate', label: 'End date', type: 'date' },
            {
              key: 'paymentStatus',
              label: 'Payment status',
              type: 'select',
              options: PAYMENT_STATUS_OPTIONS,
            },
            { key: 'search', label: 'Search', placeholder: 'Booking, method…' },
          ]}
        />

        {error ? (
          <div className="surface-card">
            <ErrorState description={error} onRetry={load} />
          </div>
        ) : (
          <>
            <ReportStatCards
              loading={loading}
              cards={[
                {
                  title: 'Collected',
                  value: summary.total,
                  format: 'currency',
                  icon: IndianRupee,
                  tone: 'success',
                  description: 'Successful payments',
                },
                {
                  title: 'Payments',
                  value: filtered.length,
                  icon: CreditCard,
                  tone: 'accent',
                  description: 'All statuses in filter',
                },
                {
                  title: 'Pending Amount',
                  value: pendingAmount,
                  format: 'currency',
                  icon: CircleCheck,
                  tone: 'warning',
                  description: 'Awaiting settlement',
                },
                {
                  title: 'Failed',
                  value: failedCount,
                  icon: CircleAlert,
                  tone: 'danger',
                  description: 'Failed attempts',
                },
              ]}
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard title="Successful revenue trend" description="Last 14 days">
                <AreaChart data={summary.trend} />
              </ChartCard>
              <ChartCard title="Method mix" description="Count by payment method">
                <PieChart data={methodChart} />
              </ChartCard>
            </div>

            <DataTable
              columns={columns}
              data={data}
              loading={loading}
              searchable
              searchValue={filters.search}
              onSearchChange={(value) => {
                setPage(1);
                setFilters((prev) => ({ ...prev, search: value }));
              }}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={(key, order) => {
                setSortBy(key);
                setSortOrder(order);
              }}
              pagination={pagination}
              onPageChange={setPage}
              emptyTitle="No payments found"
              emptyDescription="Try adjusting status or date filters."
            />
          </>
        )}
      </div>
    </MasterPage>
  );
}
