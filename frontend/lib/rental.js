export const RENTAL_STATUS = Object.freeze({
  Pending: 'Pending',
  Confirmed: 'Confirmed',
  Ready_for_Pickup: 'Ready_for_Pickup',
  Picked_Up: 'Picked_Up',
  Active: 'Active',
  Return_Pending: 'Return_Pending',
  Returned: 'Returned',
  Inspection: 'Inspection',
  Refund_Pending: 'Refund_Pending',
  Completed: 'Completed',
  Cancelled: 'Cancelled',
});

export const RENTAL_STATUS_OPTIONS = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Confirmed', label: 'Confirmed' },
  { value: 'Ready_for_Pickup', label: 'Ready for Pickup' },
  { value: 'Picked_Up', label: 'Picked Up' },
  { value: 'Active', label: 'Active' },
  { value: 'Return_Pending', label: 'Return Pending' },
  { value: 'Returned', label: 'Returned' },
  { value: 'Inspection', label: 'Inspection' },
  { value: 'Refund_Pending', label: 'Refund Pending' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
];

export function computeGrandTotal({ subtotal, tax, discount, securityDeposit, lateFee }) {
  return (
    Number(subtotal || 0) +
    Number(tax || 0) -
    Number(discount || 0) +
    Number(securityDeposit || 0) +
    Number(lateFee || 0)
  );
}
