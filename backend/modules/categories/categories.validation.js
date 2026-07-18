import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    categoryName: z.string().min(1, 'Category Name is required'),
    vehicleType: z.enum(['Two_Wheeler', 'Four_Wheeler']),
    description: z.string().optional().nullable(),
    status: z.boolean().optional(),
  })
});

export const updateCategorySchema = z.object({
  body: z.object({
    categoryName: z.string().min(1, 'Category Name is required').optional(),
    vehicleType: z.enum(['Two_Wheeler', 'Four_Wheeler']).optional(),
    description: z.string().optional().nullable(),
    status: z.boolean().optional(),
  })
});
