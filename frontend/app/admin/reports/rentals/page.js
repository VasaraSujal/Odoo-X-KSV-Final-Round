'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardList, CheckCircle2, Clock3, IndianRupee } from 'lucide-react';
import MasterPage from '@/components/master/MasterPage';
import FilterPanel from '@/components/forms/FilterPanel';
import DataTable from '@/components/tables/DataTable';
import ChartCard from '@/components/dashboard/ChartCard';
import ErrorState from '@/components/dashboard/ErrorState';
import StatusBadge from '@/components/master/StatusBadge';
import ReportStatCards from '@/components/reports/ReportStatCards';
import ReportExportBar from '@/components/reports/ReportExportBar';
import { BarChart, PieChart } from '@/components/charts';
import reportsService from '@/services/reportsService';
import categoryService from '@/services/categoryService';
import vehicleService from '@/services/vehicleService';
import useReportExport from '@/hooks/useReportExport';
import { APP_ROUTES } from '@/constants/routes';
import { RENTAL_STATUS_OPTIONS } from '@/lib/rental';
import {
  formatCurrency,
  formatDateTime,
  customerName,
  vehicleLabel,
  toNumber,
} from '@/lib/format';
import {
  buildReportParams,
  filterRentalsClient,
  summarizeRentals,
} from '@/lib/reports';
import { filterAndPaginate } from '@/lib/listUtils';
import { getErrorMessage } from '@/lib/apiResponse';

const EMPTY_FILTERS = {
  startDate: '',
  endDate: '',
  status: '',
  vehicleId: '',
  categoryId: '',
  search: '',
};

export default function RentalReportPage() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [raw, setRaw] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    Promise.all([
      categoryService.getAll(),
      vehicleService.getVehicles({ limit: 200 }),
    ])
      .then(([cats, vehs]) => {
        setCategories(Array.isArray(cats.data) ? cats.data : []);
        setVehicles(vehs.data?.vehicles || []);
      })
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = buildReportParams(filters);
      const result = await reportsService.getRentalReport(params);
      setRaw(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filters.startDate, filters.endDate, filters.status]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () =>
      filterRentalsClient(raw, {
        vehicleId: filters.vehicleId,
        categoryId: filters.categoryId,
        search: filters.search,
      }),
    [raw, filters.vehicleId, filters.categoryId, filters.search]
  );

  const summary = useMemo(() => summarizeRentals(filtered), [filtered]);

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
    exportType: 'rentals',
    filters,
  });

  const columns = [
    {
      key: 'bookingNumber',
      header: 'Booking',
      sortable: true,
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (_, row) => customerName(row.customer),
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      render: (_, row) => vehicleLabel(row.rentalItems),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (v) => <StatusBadge status={v} />,
    },
    {
      key: 'grandTotal',
      header: 'Total',
      sortable: true,
      render: (v, row) => formatCurrency(v ?? row.totalAmount),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (v) => formatDateTime(v),
    },
  ];

  return (
    <MasterPage
      title="Rental Report"
      description="Booking volume, status mix, and vehicle assignments"
      backHref={APP_ROUTES.ADMIN.REPORTS}
      breadcrumbs={[
        { label: 'Admin', href: APP_ROUTES.ADMIN.ROOT },
        { label: 'Reports', href: APP_ROUTES.ADMIN.REPORTS },
        { label: 'Rentals' },
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
              key: 'status',
              label: 'Rental status',
              type: 'select',
              options: RENTAL_STATUS_OPTIONS,
            },
            {
              key: 'categoryId',
              label: 'Category',
              type: 'select',
              options: categories.map((c) => ({ value: c.id, label: c.name })),
            },
            {
              key: 'vehicleId',
              label: 'Vehicle',
              type: 'select',
              options: vehicles.map((v) => ({
                value: v.id,
                label: [v.make, v.model, v.registrationNumber].filter(Boolean).join(' · '),
              })),
            },
            { key: 'search', label: 'Search', placeholder: 'Booking, customer…' },
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
                  title: 'Total Rentals',
                  value: summary.total,
                  icon: ClipboardList,
                  tone: 'accent',
                  description: 'Orders in filtered set',
                },
                {
                  title: 'Active',
                  value: summary.byStatus.ACTIVE || 0,
                  icon: Clock3,
                  tone: 'warning',
                  description: 'Currently on hire',
                },
                {
                  title: 'Completed',
                  value: summary.byStatus.COMPLETED || 0,
                  icon: CheckCircle2,
                  tone: 'success',
                  description: 'Closed bookings',
                },
                {
                  title: 'Booking Value',
                  value: summary.totalAmount,
                  format: 'currency',
                  icon: IndianRupee,
                  tone: 'secondary',
                  description: 'Sum of grand totals',
                },
              ]}
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard title="Status mix" description="Rentals by status">
                <PieChart data={summary.statusChart} />
              </ChartCard>
              <ChartCard title="Status volume" description="Count comparison">
                <BarChart
                  data={summary.statusChart.map((s) => ({
                    name: s.name,
                    value: s.value,
                    key: s.key,
                  }))}
                />
              </ChartCard>
            </div>

            <DataTable
              columns={columns}
              data={data.map((row) => ({
                ...row,
                grandTotal: toNumber(row.grandTotal ?? row.totalAmount),
              }))}
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
              emptyTitle="No rental records"
              emptyDescription="Try adjusting filters or date range."
            />
          </>
        )}
      </div>
    </MasterPage>
  );
}
