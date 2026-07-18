'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { IndianRupee, Receipt, TrendingUp, Wallet } from 'lucide-react';
import MasterPage from '@/components/master/MasterPage';
import FilterPanel from '@/components/forms/FilterPanel';
import DataTable from '@/components/tables/DataTable';
import ChartCard from '@/components/dashboard/ChartCard';
import ErrorState from '@/components/dashboard/ErrorState';
import ReportStatCards from '@/components/reports/ReportStatCards';
import ReportExportBar from '@/components/reports/ReportExportBar';
import { AreaChart, PieChart } from '@/components/charts';
import reportsService from '@/services/reportsService';
import useReportExport from '@/hooks/useReportExport';
import { APP_ROUTES } from '@/constants/routes';
import { formatCurrency, formatDateTime } from '@/lib/format';
import {
  buildReportParams,
  filterPaymentsClient,
  summarizeRevenue,
} from '@/lib/reports';
import { filterAndPaginate } from '@/lib/listUtils';
import { getErrorMessage } from '@/lib/apiResponse';

const EMPTY_FILTERS = {
  startDate: '',
  endDate: '',
  search: '',
};

export default function RevenueReportPage() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [raw, setRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('paidAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = buildReportParams(filters);
      const result = await reportsService.getRevenueReport(params);
      setRaw(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filters.startDate, filters.endDate]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () => filterPaymentsClient(raw, { search: filters.search }),
    [raw, filters.search]
  );

  const summary = useMemo(() => summarizeRevenue(filtered), [filtered]);

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

  const { exporting, exportFile } = useReportExport({
    exportType: 'revenue',
    filters,
  });

  const columns = [
    {
      key: 'paidAt',
      header: 'Paid At',
      sortable: true,
      render: (v, row) => formatDateTime(v || row.createdAt),
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
      title="Revenue Report"
      description="Successful payment settlements across the selected period"
      backHref={APP_ROUTES.ADMIN.REPORTS}
      breadcrumbs={[
        { label: 'Admin', href: APP_ROUTES.ADMIN.ROOT },
        { label: 'Reports', href: APP_ROUTES.ADMIN.REPORTS },
        { label: 'Revenue' },
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
                  title: 'Total Revenue',
                  value: summary.total,
                  format: 'currency',
                  icon: IndianRupee,
                  tone: 'success',
                  description: 'Successful payments in range',
                },
                {
                  title: 'Transactions',
                  value: summary.count,
                  icon: Receipt,
                  tone: 'accent',
                  description: 'Paid settlements',
                },
                {
                  title: 'Avg Ticket',
                  value: summary.count ? summary.total / summary.count : 0,
                  format: 'currency',
                  icon: Wallet,
                  tone: 'warning',
                  description: 'Average successful payment',
                },
                {
                  title: 'Methods',
                  value: summary.methodChart.length,
                  icon: TrendingUp,
                  tone: 'secondary',
                  description: 'Distinct payment methods',
                },
              ]}
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard title="Revenue trend" description="Daily successful payments">
                <AreaChart data={summary.trend} dataKey="value" xKey="label" />
              </ChartCard>
              <ChartCard title="By method" description="Revenue mix by payment method">
                <PieChart data={summary.methodChart} />
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
              emptyTitle="No revenue records"
              emptyDescription="Successful payments in this range will appear here."
            />
          </>
        )}
      </div>
    </MasterPage>
  );
}
