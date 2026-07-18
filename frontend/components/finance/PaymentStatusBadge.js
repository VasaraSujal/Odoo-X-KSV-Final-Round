'use client';

import Badge from '@/components/ui/Badge';

const STATUS_META = {
  PENDING: { label: 'Pending', tone: 'warning' },
  PARTIAL: { label: 'Partial', tone: 'warning' },
  PAID: { label: 'Paid', tone: 'success' },
  SUCCESS: { label: 'Paid', tone: 'success' },
  REFUNDED: { label: 'Refunded', tone: 'admin' },
  FAILED: { label: 'Failed', tone: 'danger' },
  CANCELLED: { label: 'Cancelled', tone: 'danger' },
  NOT_REFUNDED: { label: 'Not Refunded', tone: 'warning' },
  PARTIALLY_REFUNDED: { label: 'Partially Refunded', tone: 'accent' },
  CASH: { label: 'Cash', tone: 'default' },
  UPI: { label: 'UPI', tone: 'accent' },
  CARD: { label: 'Card', tone: 'accent' },
  NET_BANKING: { label: 'Bank Transfer', tone: 'default' },
};

export default function PaymentStatusBadge({ status, label }) {
  if (!status && !label) return <Badge>—</Badge>;
  const key = String(status || '').toUpperCase();
  const meta = STATUS_META[key] || {
    label: label || status || '—',
    tone: 'default',
  };
  return <Badge tone={meta.tone}>{label || meta.label}</Badge>;
}
