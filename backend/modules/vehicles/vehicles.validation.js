import { z } from 'zod';

export const createVehicleSchema = z.object({
  body: z.object({
    categoryId: z.string().uuid('Invalid category ID'),
    vehicleName: z.string().min(1, 'Vehicle Name is required'),
    brand: z.string().min(1, 'Brand is required'),
    model: z.string().min(1, 'Model is required'),
    registrationNumber: z.string().min(1, 'Registration Number is required'),
    year: z.number().int().min(1900),
    fuelType: z.enum(['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG']),
    transmission: z.enum(['Manual', 'Automatic']),
    color: z.string().min(1),
    seatCapacity: z.number().int().positive(),
    mileage: z.number().nonnegative(),
    engineCapacity: z.string().optional().nullable(),
    currentOdometer: z.number().int().nonnegative().optional(),
    rentPerHour: z.number().positive(),
    rentPerDay: z.number().positive(),
    rentPerWeek: z.number().positive(),
    rentPerMonth: z.number().positive(),
    securityDeposit: z.number().nonnegative(),
    description: z.string().optional().nullable(),
    status: z.enum(['Available', 'Reserved', 'Rented', 'Maintenance']).optional()
  })
});

export const updateVehicleSchema = z.object({
  body: z.object({
    categoryId: z.string().uuid().optional(),
    vehicleName: z.string().optional(),
    brand: z.string().optional(),
    model: z.string().optional(),
    registrationNumber: z.string().optional(),
    year: z.number().int().optional(),
    fuelType: z.enum(['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG']).optional(),
    transmission: z.enum(['Manual', 'Automatic']).optional(),
    color: z.string().optional(),
    seatCapacity: z.number().int().positive().optional(),
    mileage: z.number().nonnegative().optional(),
    engineCapacity: z.string().optional().nullable(),
    currentOdometer: z.number().int().nonnegative().optional(),
    rentPerHour: z.number().positive().optional(),
    rentPerDay: z.number().positive().optional(),
    rentPerWeek: z.number().positive().optional(),
    rentPerMonth: z.number().positive().optional(),
    securityDeposit: z.number().nonnegative().optional(),
    description: z.string().optional().nullable(),
    status: z.enum(['Available', 'Reserved', 'Rented', 'Maintenance']).optional()
  })
});
