import { z } from 'zod';

export const settingsSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(120),
  companyEmail: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email'),
  companyPhone: z.string().max(30).optional().or(z.literal('')),
  companyAddress: z.string().max(500).optional().or(z.literal('')),
  gstNumber: z.string().max(40).optional().or(z.literal('')),
  currency: z.string().min(1, 'Currency is required').max(10),
  taxPercentage: z.coerce
    .number({ invalid_type_error: 'Tax must be a number' })
    .min(0, 'Tax cannot be negative')
    .max(100, 'Tax cannot exceed 100'),
  invoicePrefix: z.string().max(20).optional().or(z.literal('')),
  depositRule: z.string().max(500).optional().or(z.literal('')),
  graceHours: z.coerce.number().min(0, 'Grace hours cannot be negative'),
  lateFeePerHour: z.coerce.number().min(0, 'Late fee cannot be negative'),
  lateFeePerDay: z.coerce.number().min(0, 'Late fee cannot be negative'),
  maximumLateFee: z.coerce.number().min(0, 'Maximum late fee cannot be negative'),
  quotationHeader: z.string().max(2000).optional().or(z.literal('')),
  quotationFooter: z.string().max(4000).optional().or(z.literal('')),
  timezone: z.string().optional().or(z.literal('')),
  logoUrl: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (val) => !val || /^https?:\/\//i.test(val),
      'Enter a valid URL'
    ),
});

export const SETTINGS_DEFAULTS = {
  companyName: '',
  companyEmail: '',
  companyPhone: '',
  companyAddress: '',
  gstNumber: '',
  currency: 'INR',
  taxPercentage: 0,
  invoicePrefix: 'INV',
  depositRule: '',
  graceHours: 0,
  lateFeePerHour: 0,
  lateFeePerDay: 0,
  maximumLateFee: 0,
  quotationHeader: '',
  quotationFooter: '',
  timezone: 'Asia/Kolkata',
  logoUrl: '',
};

export const TIMEZONE_OPTIONS = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'America/New_York (ET)' },
  { value: 'Europe/London', label: 'Europe/London (GMT)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT)' },
];

export const CURRENCY_OPTIONS = [
  { value: 'INR', label: 'INR — Indian Rupee' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'AED', label: 'AED — UAE Dirham' },
];
