'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, IndianRupee, Hash, Layers } from 'lucide-react';
import MasterPage from '@/components/master/MasterPage';
import FilterPanel from '@/components/forms/FilterPanel';
import DataTable from '@/components/tables/DataTable';
import ChartCard from '@/components/dashboard/ChartCard';
import ErrorState from '@/components/dashboard/ErrorState';
import ReportStatCards from '@/components/reports/ReportStatCards';
import ReportExportBar from '@/components/reports/ReportExportBar';
import { BarChart, PieChart } from '@/components/charts';
import penaltyService from '@/services/penaltyService';
import useReportExport from '@/hooks/useReportExport';
import { APP_ROUTES } from '@/constants/routes';
import { formatCurrency, formatDateTime, toNumber } from '@/lib/format';
import { summarizePenalties } from '@/lib/reports';
import { filterAndPaginate } from '@/lib/listUtils';
import { getErrorMessage } from '@/lib/apiResponse';
import dayjs from 'dayjs';

const EMPTY_FILTERS = {
  startDate: '',
  endDate: '',
  search: '',
};

export default function PenaltyReportPage() {
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
      const result = await penaltyService.getPenalties({ limit: 500 });
      const list = result.data?.penalties || result.data || [];
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

  const filtered = useMemo(() => {
    let rows = [...raw];

    if (filters.startDate) {
      const start = dayjs(filters.startDate).startOf('day');
      rows = rows.filter((p) => {
        const d = dayjs(p.createdAt);
        return d.isValid() && !d.isBefore(start);
      });
    }

    if (filters.endDate) {
      const end = dayjs(filters.endDate).endOf('day');
      rows = rows.filter((p) => {
        const d = dayjs(p.createdAt);
        return d.isValid() && !d.isAfter(end);
      });
    }

    if (filters.search?.trim()) {
      const q = filters.search.trim().toLowerCase();
      rows = rows.filter((p) =>
        [
          p.penaltyType,
          p.type,
          p.reason,
          p.description,
          p.rentalOrder?.bookingNumber,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q)
      );
    }

    return rows;
  }, [raw, filters]);

  const summary = useMemo(() => summarizePenalties(filtered), [filtered]);

  const avg =
    summary.count > 0 ? summary.total / summary.count : 0;

  const { data, pagination } = useMemo(
    () =>
      filterAndPaginate(
        filtered.map((p) => ({
          ...p,
          amount: toNumber(p.amount ?? p.penaltyAmount),
        })),
        {
          page,
          limit: 10,
          sortBy,
          order: sortOrder,
        }
      ),
    [filtered, page, sortBy, sortOrder]
  );

  const csvColumns = [
    { key: 'id', label: 'ID' },
    {
      key: 'booking',
      label: 'Booking',
      accessor: (row) => row.rentalOrder?.bookingNumber || '',
    },
    {
      key: 'type',
      label: 'Type',
      accessor: (row) => row.penaltyType || row.type || '',
    },
    {
      key: 'amount',
      label: 'Amount',
      accessor: (row) => row.amount ?? row.penaltyAmount ?? '',
    },
    { key: 'createdAt', label: 'Created At' },
  ];

  const { exporting, exportFile } = useReportExport({
    exportType: 'penalties',
    clientRows: filtered,
    clientColumns: csvColumns,
    clientFilename: 'penalties-report.csv',
  });

  const columns = [
    {
      key: 'createdAt',
      header: 'Date',
      sortable: true,
      render: (v) => formatDateTime(v),
    },
    {
      key: 'booking',
      header: 'Booking',
      render: (_, row) => row.rentalOrder?.bookingNumber || '—',
    },
    {
      key: 'penaltyType',
      header: 'Type',
      render: (v, row) => v || row.type || '—',
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (v, row) => v || row.description || '—',
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (v) => (
        <span className="font-semibold tabular-nums text-danger">
          {formatCurrency(v)}
        </span>
      ),
    },
  ];

  return (
    <MasterPage
      title="Penalty Report"
      description="Late fees and penalty amounts by type and period"
      backHref={APP_ROUTES.ADMIN.REPORTS}
      breadcrumbs={[
        { label: 'Admin', href: APP_ROUTES.ADMIN.ROOT },
        { label: 'Reports', href: APP_ROUTES.ADMIN.REPORTS },
        { label: 'Penalties' },
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
            { key: 'search', label: 'Search', placeholder: 'Type, booking, reason…' },
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
                  title: 'Total Penalties',
                  value: summary.count,
                  icon: Hash,
                  tone: 'accent',
                  description: 'Records in filter',
                },
                {
                  title: 'Penalty Amount',
                  value: summary.total,
                  format: 'currency',
                  icon: IndianRupee,
                  tone: 'danger',
                  description: 'Sum of penalty charges',
                },
                {
                  title: 'Average',
                  value: avg,
                  format: 'currency',
                  icon: AlertTriangle,
                  tone: 'warning',
                  description: 'Average penalty amount',
                },
                {
                  title: 'Types',
                  value: summary.typeChart.length,
                  icon: Layers,
                  tone: 'secondary',
                  description: 'Distinct penalty types',
                },
              ]}
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard title="By type" description="Penalty amount mix">
                <PieChart data={summary.typeChart} />
              </ChartCard>
              <ChartCard title="Type comparison" description="Amount by penalty type">
                <BarChart data={summary.typeChart} />
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
              emptyTitle="No penalties found"
              emptyDescription="Penalties recorded in this range will appear here."
            />
          </>
        )}
      </div>
    </MasterPage>
  );
}
