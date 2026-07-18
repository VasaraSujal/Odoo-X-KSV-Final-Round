export const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'CARD', label: 'Card' },
  { value: 'NET_BANKING', label: 'Bank Transfer' },
];

export const PAYMENT_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'SUCCESS', label: 'Paid / Success' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'REFUNDED', label: 'Refunded' },
];

export const ORDER_PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PARTIAL: 'PARTIAL',
  PAID: 'PAID',
};

export const DEPOSIT_STATUS_OPTIONS = [
  { value: 'NOT_REFUNDED', label: 'Not Refunded' },
  { value: 'PARTIALLY_REFUNDED', label: 'Partially Refunded' },
  { value: 'REFUNDED', label: 'Refunded' },
];

export function remainingDeposit(deposit) {
  if (!deposit) return 0;
  return (
    Number(deposit.depositAmount || 0) -
    Number(deposit.refundAmount || 0) -
    Number(deposit.penaltyAmount || 0)
  );
}

export function sumSuccessfulPayments(payments = []) {
  return payments
    .filter((p) => {
      const status = String(p.paymentStatus || '').toUpperCase();
      return status === 'PAID' || status === 'SUCCESS';
    })
    .reduce((sum, p) => sum + Number(p.totalAmount || p.amount || 0), 0);
}

export function computeBalanceFromOrder(order, payments = []) {
  const total = Number(order?.rentalAmount || order?.grandTotal || 0);
  const paid = sumSuccessfulPayments(payments);
  return Math.max(0, total - paid);
}
