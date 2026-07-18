import { z } from 'zod';

export const createRentalPeriodSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    days: z.number().int().positive('Days must be greater than 0'),
    description: z.string().optional(),
    status: z.boolean().optional(),
  })
});

export const updateRentalPeriodSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    days: z.number().int().positive().optional(),
    description: z.string().optional(),
    status: z.boolean().optional(),
  })
});
