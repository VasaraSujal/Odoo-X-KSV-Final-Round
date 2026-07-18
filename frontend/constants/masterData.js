/**
 * Master data option constants aligned with backend database enums.
 */
export const VEHICLE_AVAILABILITY = Object.freeze({
  Available: 'Available',
  Reserved: 'Reserved',
  Rented: 'Rented',
  Maintenance: 'Maintenance',
});

export const AVAILABILITY_OPTIONS = [
  { value: 'Available', label: 'Available' },
  { value: 'Reserved', label: 'Reserved' },
  { value: 'Rented', label: 'Rented' },
  { value: 'Maintenance', label: 'Maintenance' },
];

export const FUEL_OPTIONS = [
  { value: 'Petrol', label: 'Petrol' },
  { value: 'Diesel', label: 'Diesel' },
  { value: 'Electric', label: 'Electric' },
  { value: 'Hybrid', label: 'Hybrid' },
  { value: 'CNG', label: 'CNG' },
];

export const TRANSMISSION_OPTIONS = [
  { value: 'Manual', label: 'Manual' },
  { value: 'Automatic', label: 'Automatic' },
];

export const PRICING_TYPE_OPTIONS = [
  { value: 'Hour', label: 'Hourly' },
  { value: 'Day', label: 'Daily' },
  { value: 'Week', label: 'Weekly' },
  { value: 'Month', label: 'Monthly' },
];

export const STATUS_OPTIONS = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];
