'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Car, CarFront, Wrench, Layers } from 'lucide-react';
import MasterPage from '@/components/master/MasterPage';
import FilterPanel from '@/components/forms/FilterPanel';
import DataTable from '@/components/tables/DataTable';
import ChartCard from '@/components/dashboard/ChartCard';
import ErrorState from '@/components/dashboard/ErrorState';
import StatusBadge from '@/components/master/StatusBadge';
import ReportStatCards from '@/components/reports/ReportStatCards';
import ReportExportBar from '@/components/reports/ReportExportBar';
import { BarChart, PieChart } from '@/components/charts';
import vehicleService from '@/services/vehicleService';
import categoryService from '@/services/categoryService';
import useReportExport from '@/hooks/useReportExport';
import { APP_ROUTES } from '@/constants/routes';
import { AVAILABILITY_OPTIONS } from '@/constants/masterData';
import { formatCurrency } from '@/lib/format';
import { summarizeVehicles } from '@/lib/reports';
import { filterAndPaginate } from '@/lib/listUtils';
import { getErrorMessage } from '@/lib/apiResponse';

const EMPTY_FILTERS = {
  categoryId: '',
  availability: '',
  search: '',
};

export default function VehicleReportPage() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [raw, setRaw] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [vehRes, catRes] = await Promise.all([
        vehicleService.getVehicles({ limit: 500 }),
        categoryService.getAll(),
      ]);
      setRaw(vehRes.data?.vehicles || []);
      setCategories(Array.isArray(catRes.data) ? catRes.data : []);
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
    if (filters.categoryId) {
      rows = rows.filter(
        (v) => v.categoryId === filters.categoryId || v.category?.id === filters.categoryId
      );
    }
    if (filters.availability) {
      rows = rows.filter((v) => v.availability === filters.availability);
    }
    if (filters.search?.trim()) {
      const q = filters.search.trim().toLowerCase();
      rows = rows.filter((v) =>
        [v.make, v.model, v.registrationNumber, v.category?.name]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q)
      );
    }
    return rows;
  }, [raw, filters]);

  const summary = useMemo(() => summarizeVehicles(filtered), [filtered]);

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
    { key: 'registrationNumber', label: 'Registration' },
    { key: 'make', label: 'Make' },
    { key: 'model', label: 'Model' },
    { key: 'availability', label: 'Availability' },
    {
      key: 'category',
      label: 'Category',
      accessor: (row) => row.category?.name || '',
    },
    { key: 'basePrice', label: 'Base Price' },
  ];

  const { exporting, exportFile } = useReportExport({
    exportType: 'vehicles',
    clientRows: filtered,
    clientColumns: csvColumns,
    clientFilename: 'vehicles-report.csv',
  });

  const available = filtered.filter((v) => v.availability === 'AVAILABLE').length;
  const maintenance = filtered.filter((v) => v.availability === 'UNDER_MAINTENANCE').length;

  const columns = [
    {
      key: 'registrationNumber',
      header: 'Registration',
      sortable: true,
    },
    {
      key: 'make',
      header: 'Vehicle',
      render: (v, row) => [v, row.model].filter(Boolean).join(' '),
    },
    {
      key: 'category',
      header: 'Category',
      render: (_, row) => row.category?.name || '—',
    },
    {
      key: 'availability',
      header: 'Availability',
      sortable: true,
      render: (v) => <StatusBadge status={v} />,
    },
    {
      key: 'basePrice',
      header: 'Base Price',
      sortable: true,
      render: (v) => formatCurrency(v),
    },
  ];

  return (
    <MasterPage
      title="Vehicle Report"
      description="Fleet availability, category mix, and pricing snapshot"
      backHref={APP_ROUTES.ADMIN.REPORTS}
      breadcrumbs={[
        { label: 'Admin', href: APP_ROUTES.ADMIN.ROOT },
        { label: 'Reports', href: APP_ROUTES.ADMIN.REPORTS },
        { label: 'Vehicles' },
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
            {
              key: 'categoryId',
              label: 'Category',
              type: 'select',
              options: categories.map((c) => ({ value: c.id, label: c.name })),
            },
            {
              key: 'availability',
              label: 'Availability',
              type: 'select',
              options: AVAILABILITY_OPTIONS,
            },
            { key: 'search', label: 'Search', placeholder: 'Make, model, plate…' },
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
                  title: 'Fleet Size',
                  value: summary.total,
                  icon: Car,
                  tone: 'accent',
                  description: 'Vehicles in filtered set',
                },
                {
                  title: 'Available',
                  value: available,
                  icon: CarFront,
                  tone: 'success',
                  description: 'Ready for booking',
                },
                {
                  title: 'Maintenance',
                  value: maintenance,
                  icon: Wrench,
                  tone: 'warning',
                  description: 'Temporarily offline',
                },
                {
                  title: 'Categories',
                  value: summary.categoryChart.length,
                  icon: Layers,
                  tone: 'secondary',
                  description: 'Distinct categories',
                },
              ]}
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard title="Availability" description="Fleet by availability status">
                <PieChart data={summary.availabilityChart} />
              </ChartCard>
              <ChartCard title="By category" description="Vehicle count per category">
                <BarChart data={summary.categoryChart} />
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
              emptyTitle="No vehicles found"
              emptyDescription="Adjust filters to explore the fleet report."
            />
          </>
        )}
      </div>
    </MasterPage>
  );
}
