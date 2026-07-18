import dayjs from 'dayjs';
import { toNumber } from '@/lib/format';

export const REPORT_EXPORT_TYPES = Object.freeze({
  RENTALS: 'rentals',
  REVENUE: 'revenue',
});

export function buildReportParams(filters = {}) {
  const params = {};
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.status) params.status = filters.status;
  if (filters.type) params.type = filters.type;
  return params;
}

export function filterRentalsClient(rentals = [], filters = {}) {
  let rows = [...rentals];

  if (filters.vehicleId) {
    rows = rows.filter((r) =>
      (r.rentalItems || []).some((item) => item.vehicleId === filters.vehicleId || item.vehicle?.id === filters.vehicleId)
    );
  }

  if (filters.categoryId) {
    rows = rows.filter((r) =>
      (r.rentalItems || []).some(
        (item) =>
          item.vehicle?.categoryId === filters.categoryId ||
          item.vehicle?.category?.id === filters.categoryId
      )
    );
  }

  if (filters.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    rows = rows.filter((r) => {
      const customer = [r.customer?.firstName, r.customer?.lastName, r.customer?.email]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const booking = String(r.bookingNumber || '').toLowerCase();
      const vehicles = (r.rentalItems || [])
        .map((i) =>
          [i.vehicle?.make, i.vehicle?.model, i.vehicle?.registrationNumber]
            .filter(Boolean)
            .join(' ')
        )
        .join(' ')
        .toLowerCase();
      return customer.includes(q) || booking.includes(q) || vehicles.includes(q);
    });
  }

  return rows;
}

export function filterPaymentsClient(payments = [], filters = {}) {
  let rows = [...payments];

  if (filters.paymentStatus) {
    rows = rows.filter((p) => p.paymentStatus === filters.paymentStatus);
  }

  if (filters.startDate) {
    const start = dayjs(filters.startDate).startOf('day');
    rows = rows.filter((p) => {
      const d = dayjs(p.paidAt || p.createdAt);
      return d.isValid() && !d.isBefore(start);
    });
  }

  if (filters.endDate) {
    const end = dayjs(filters.endDate).endOf('day');
    rows = rows.filter((p) => {
      const d = dayjs(p.paidAt || p.createdAt);
      return d.isValid() && !d.isAfter(end);
    });
  }

  if (filters.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    rows = rows.filter((p) => {
      const hay = [
        p.id,
        p.transactionId,
        p.paymentMethod,
        p.paymentStatus,
        p.rentalOrder?.bookingNumber,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }

  return rows;
}

export function summarizeRentals(rentals = []) {
  const byStatus = {};
  let totalAmount = 0;

  rentals.forEach((r) => {
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    totalAmount += toNumber(r.grandTotal ?? r.totalAmount);
  });

  return {
    total: rentals.length,
    totalAmount,
    byStatus,
    statusChart: Object.entries(byStatus).map(([name, value]) => ({ name, value, key: name })),
  };
}

export function summarizeRevenue(payments = []) {
  const total = payments.reduce((sum, p) => sum + toNumber(p.amount), 0);
  const byMethod = {};

  payments.forEach((p) => {
    const method = p.paymentMethod || 'OTHERS';
    byMethod[method] = (byMethod[method] || 0) + toNumber(p.amount);
  });

  return {
    count: payments.length,
    total,
    methodChart: Object.entries(byMethod).map(([name, value]) => ({ name, value, key: name })),
    trend: binPaymentsByDay(payments, 14),
  };
}

export function binPaymentsByDay(payments = [], days = 14) {
  const map = new Map();
  const end = dayjs().endOf('day');
  const start = end.subtract(days - 1, 'day').startOf('day');

  for (let i = 0; i < days; i += 1) {
    const key = start.add(i, 'day').format('YYYY-MM-DD');
    map.set(key, 0);
  }

  payments.forEach((p) => {
    const raw = p.paidAt || p.createdAt;
    if (!raw) return;
    const key = dayjs(raw).format('YYYY-MM-DD');
    if (!map.has(key)) return;
    map.set(key, map.get(key) + toNumber(p.amount));
  });

  return Array.from(map.entries()).map(([date, value]) => ({
    date,
    label: dayjs(date).format('DD MMM'),
    value,
  }));
}

export function summarizeVehicles(vehicles = []) {
  const byAvailability = {};
  const byCategory = {};

  vehicles.forEach((v) => {
    const avail = v.availability || 'UNKNOWN';
    byAvailability[avail] = (byAvailability[avail] || 0) + 1;
    const cat = v.category?.name || 'Uncategorized';
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  });

  return {
    total: vehicles.length,
    availabilityChart: Object.entries(byAvailability).map(([name, value]) => ({
      name,
      value,
      key: name,
    })),
    categoryChart: Object.entries(byCategory).map(([name, value]) => ({
      name,
      value,
      key: name,
    })),
  };
}

export function summarizePenalties(penalties = []) {
  const total = penalties.reduce((sum, p) => sum + toNumber(p.amount ?? p.penaltyAmount), 0);
  const byType = {};

  penalties.forEach((p) => {
    const type = p.penaltyType || p.type || 'OTHER';
    byType[type] = (byType[type] || 0) + toNumber(p.amount ?? p.penaltyAmount);
  });

  return {
    count: penalties.length,
    total,
    typeChart: Object.entries(byType).map(([name, value]) => ({ name, value, key: name })),
  };
}

/** Client-side CSV when backend export type is unavailable for a module. */
export function downloadClientCsv(filename, rows = [], columns = []) {
  const escape = (val) => {
    const s = val == null ? '' : String(val);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const header = columns.map((c) => escape(c.label)).join(',');
  const body = rows
    .map((row) => columns.map((c) => escape(typeof c.accessor === 'function' ? c.accessor(row) : row[c.key])).join(','))
    .join('\n');

  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
