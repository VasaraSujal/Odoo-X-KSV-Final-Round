'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dashboardService from '@/services/dashboardService';
import analyticsService from '@/services/analyticsService';
import rentalService from '@/services/rentalService';
import paymentService from '@/services/paymentService';
import securityDepositService from '@/services/securityDepositService';
import { getErrorMessage } from '@/lib/apiResponse';
import {
  aggregatePaymentMethods,
  binByDay,
  toNumber,
} from '@/lib/format';
import {
  buildCacheKey,
  getCached,
  isUsable,
  setCached,
  CACHE_TTL,
} from '@/lib/queryCache';

const emptyOverview = {
  vehicles: { total: 0, available: 0, reserved: 0, rented: 0, maintenance: 0 },
  customers: { total: 0 },
  rentals: { total: 0, active: 0, completed: 0, cancelled: 0, pending: 0 },
  revenue: { total: 0, today: 0, monthly: 0 },
  payments: { pendingAmount: 0 },
};

const DASHBOARD_CACHE_KEY = buildCacheKey('page', 'admin-dashboard', {});

async function safe(promise) {
  try {
    return await promise;
  } catch (error) {
    return { __error: error };
  }
}

function mapDashboardPayload(results) {
  const [
    overviewRes,
    revenueRes,
    rentalsTodayRes,
    vehiclesByCatRes,
    paymentsSummaryRes,
    revenueTrendRes,
    rentalTrendRes,
    recentRentalsRes,
    recentPaymentsRes,
    depositsRes,
  ] = results.map((r) => (r?.__error ? null : r));

  const overview = overviewRes?.data || emptyOverview;
  const paymentsSummary = paymentsSummaryRes?.data || {
    totalPaid: 0,
    pendingAmount: 0,
    refundAmount: 0,
  };

  const recentRentals = recentRentalsRes?.data?.orders || [];
  const recentPayments = recentPaymentsRes?.data?.payments || [];

  const revenueTrendRows = Array.isArray(revenueTrendRes?.data)
    ? revenueTrendRes.data
    : [];
  const rentalTrendRows = Array.isArray(rentalTrendRes?.data)
    ? rentalTrendRes.data
    : [];

  const failed = results.some((r) => r?.__error);

  return {
    overview,
    revenuePeriods: revenueRes?.data || {
      today: 0,
      weekly: 0,
      monthly: 0,
      yearly: 0,
    },
    todayOps: rentalsTodayRes?.data || { todayPickups: 0, todayReturns: 0 },
    vehiclesByCategory: vehiclesByCatRes?.data?.byCategory || [],
    paymentsSummary,
    penaltyCount: 0,
    depositCount: toNumber(depositsRes?.data?.pagination?.total),
    recentRentals,
    recentPayments,
    paymentMethods: aggregatePaymentMethods(recentPayments),
    revenueTrend: binByDay(revenueTrendRows, {
      dateKey: 'paymentDate',
      valueAccessor: (row) => row?._sum?.totalAmount,
      days: 14,
    }),
    rentalTrend: binByDay(rentalTrendRows, {
      dateKey: 'createdAt',
      valueAccessor: (row) => row?._count?.id,
      days: 14,
    }),
    partialFailure: Boolean(failed && !results[0]?.__error),
  };
}

export default function useDashboardData() {
  const warm = getCached(DASHBOARD_CACHE_KEY);
  const hasWarm = Boolean(warm && isUsable(warm, CACHE_TTL.stale));

  const [loading, setLoading] = useState(!hasWarm);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(() => (hasWarm ? warm.data : null));
  const dataRef = useRef(data);
  dataRef.current = data;

  const load = useCallback(async ({ silent = false } = {}) => {
    setError(null);
    if (silent || dataRef.current) setRefreshing(true);
    else setLoading(true);

    const results = await Promise.all([
      safe(dashboardService.getOverview()),
      safe(dashboardService.getRevenue()),
      safe(dashboardService.getRentals()),
      safe(dashboardService.getVehicles()),
      safe(dashboardService.getPayments()),
      safe(analyticsService.getRevenueTrend()),
      safe(analyticsService.getRentalTrend()),
      safe(
        rentalService.getRentalOrders({
          limit: 5,
          sortBy: 'createdAt',
          order: 'desc',
        })
      ),
      safe(
        paymentService.getPayments({
          limit: 12,
          sortBy: 'createdAt',
          order: 'desc',
        })
      ),
      safe(securityDepositService.getDeposits({ limit: 1, page: 1 })),
    ]);

    if (results[0]?.__error) {
      setError(getErrorMessage(results[0].__error, 'Failed to load dashboard'));
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const mapped = mapDashboardPayload(results);
    setData(mapped);
    setCached(DASHBOARD_CACHE_KEY, mapped);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load({ silent: hasWarm });
  }, [load, hasWarm]);

  return { loading, refreshing, error, data, reload: () => load({ silent: false }) };
}
