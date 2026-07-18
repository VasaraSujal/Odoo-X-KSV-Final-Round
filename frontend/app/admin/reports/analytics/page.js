'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ClipboardList,
  IndianRupee,
  TrendingUp,
} from 'lucide-react';
import MasterPage from '@/components/master/MasterPage';
import FilterPanel from '@/components/forms/FilterPanel';
import ChartCard from '@/components/dashboard/ChartCard';
import ErrorState from '@/components/dashboard/ErrorState';
import ReportStatCards from '@/components/reports/ReportStatCards';
import ReportExportBar from '@/components/reports/ReportExportBar';
import { AreaChart, BarChart, LineChart, PieChart } from '@/components/charts';
import analyticsService from '@/services/analyticsService';
import dashboardService from '@/services/dashboardService';
import reportsService from '@/services/reportsService';
import useReportExport from '@/hooks/useReportExport';
import { APP_ROUTES } from '@/constants/routes';
import {
  binByDay,
  toNumber,
  aggregatePaymentMethods,
} from '@/lib/format';
import { buildReportParams, summarizeRentals } from '@/lib/reports';
import { getErrorMessage } from '@/lib/apiResponse';

const EMPTY_FILTERS = {
  startDate: '',
  endDate: '',
};

export default function AnalyticsSummaryPage() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [rentalTrend, setRentalTrend] = useState([]);
  const [overview, setOverview] = useState(null);
  const [rentals, setRentals] = useState([]);
  const [revenuePayments, setRevenuePayments] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = buildReportParams(filters);
      const [revTrend, rentTrend, dash, rentalReport, revenueReport] =
        await Promise.all([
          analyticsService.getRevenueTrend(),
          analyticsService.getRentalTrend(),
          dashboardService.getOverview(),
          reportsService.getRentalReport(params),
          reportsService.getRevenueReport(params),
        ]);

      setRevenueTrend(Array.isArray(revTrend.data) ? revTrend.data : []);
      setRentalTrend(Array.isArray(rentTrend.data) ? rentTrend.data : []);
      setOverview(dash.data || null);
      setRentals(Array.isArray(rentalReport.data) ? rentalReport.data : []);
      setRevenuePayments(
        Array.isArray(revenueReport.data) ? revenueReport.data : []
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filters.startDate, filters.endDate]);

  useEffect(() => {
    load();
  }, [load]);

  const revenueSeries = useMemo(
    () =>
      binByDay(revenueTrend, {
        dateKey: 'paidAt',
        valueAccessor: (row) => row?._sum?.amount,
        days: 14,
      }),
    [revenueTrend]
  );

  const rentalSeries = useMemo(
    () =>
      binByDay(rentalTrend, {
        dateKey: 'createdAt',
        valueAccessor: (row) => row?._count?.id,
        days: 14,
      }),
    [rentalTrend]
  );

  const rentalSummary = useMemo(() => summarizeRentals(rentals), [rentals]);
  const revenueTotal = useMemo(
    () => revenuePayments.reduce((sum, p) => sum + toNumber(p.amount), 0),
    [revenuePayments]
  );
  const methodChart = useMemo(
    () => aggregatePaymentMethods(revenuePayments),
    [revenuePayments]
  );

  const { exporting, exportFile } = useReportExport({
    exportType: 'revenue',
    filters,
  });

  return (
    <MasterPage
      title="Analytics Summary"
      description="Cross-module trends for revenue, rentals, and fleet health"
      backHref={APP_ROUTES.ADMIN.REPORTS}
      breadcrumbs={[
        { label: 'Admin', href: APP_ROUTES.ADMIN.ROOT },
        { label: 'Reports', href: APP_ROUTES.ADMIN.REPORTS },
        { label: 'Analytics' },
      ]}
      actions={<ReportExportBar exporting={exporting} onExport={exportFile} disabled={loading} />}
    >
      <div className="space-y-4">
        <FilterPanel
          values={filters}
          onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
          onReset={() => setFilters(EMPTY_FILTERS)}
          filters={[
            { key: 'startDate', label: 'Start date', type: 'date' },
            { key: 'endDate', label: 'End date', type: 'date' },
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
                  title: 'Period Revenue',
                  value: revenueTotal,
                  format: 'currency',
                  icon: IndianRupee,
                  tone: 'success',
                  description: 'Successful payments in range',
                },
                {
                  title: 'Period Rentals',
                  value: rentalSummary.total,
                  icon: ClipboardList,
                  tone: 'accent',
                  description: 'Orders created in range',
                },
                {
                  title: 'Monthly Revenue',
                  value: overview?.revenue?.monthly || 0,
                  format: 'currency',
                  icon: TrendingUp,
                  tone: 'warning',
                  description: 'Dashboard monthly total',
                },
                {
                  title: 'Active Rentals',
                  value: overview?.rentals?.active || 0,
                  icon: Activity,
                  tone: 'secondary',
                  description: 'Currently on hire',
                },
              ]}
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard title="Revenue trend" description="14-day successful payments">
                <AreaChart data={revenueSeries} />
              </ChartCard>
              <ChartCard title="Rental trend" description="14-day booking volume">
                <LineChart data={rentalSeries} />
              </ChartCard>
              <ChartCard title="Rental status mix" description="Orders in selected range">
                <PieChart data={rentalSummary.statusChart} />
              </ChartCard>
              <ChartCard title="Payment methods" description="Successful payment mix">
                <BarChart
                  data={methodChart.map((m) => ({
                    name: m.name,
                    value: m.value,
                    key: m.key,
                  }))}
                />
              </ChartCard>
            </div>
          </>
        )}
      </div>
    </MasterPage>
  );
}
