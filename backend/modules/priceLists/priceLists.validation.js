import { z } from 'zod';

export const createPriceListSchema = z.object({
  body: z.object({
    vehicleId: z.string().uuid('Invalid vehicle ID'),
    pricingType: z.string().min(1, 'Pricing type is required'),
    price: z.number().positive('Price must be greater than 0'),
    validFrom: z.string().datetime().optional().nullable(),
    validTo: z.string().datetime().optional().nullable(),
  })
}).refine(data => {
  if (data.body.validFrom && data.body.validTo) {
    return new Date(data.body.validFrom) <= new Date(data.body.validTo);
  }
  return true;
}, { message: 'validFrom must be before or equal to validTo', path: ['body', 'validTo'] });

export const updatePriceListSchema = z.object({
  body: z.object({
    vehicleId: z.string().uuid().optional(),
    pricingType: z.string().min(1).optional(),
    price: z.number().positive().optional(),
    validFrom: z.string().datetime().optional().nullable(),
    validTo: z.string().datetime().optional().nullable(),
  })
}).refine(data => {
  if (data.body.validFrom && data.body.validTo) {
    return new Date(data.body.validFrom) <= new Date(data.body.validTo);
  }
  return true;
}, { message: 'validFrom must be before or equal to validTo', path: ['body', 'validTo'] });
