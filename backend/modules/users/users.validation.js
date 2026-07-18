import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, 'First name is required').optional(),
    lastName: z.string().min(1, 'Last name is required').optional(),
    phone: z.string().optional(),
    profileImage: z.string().optional(),
    dateOfBirth: z.string().optional().nullable(),
    gender: z.enum(['Male', 'Female', 'Other']).optional().nullable(),
    drivingLicenseNo: z.string().optional().nullable(),
    drivingLicenseImage: z.string().optional().nullable(),
    accountStatus: z.enum(['Active', 'Inactive', 'Blocked']).optional(),
    isVerified: z.boolean().optional(),
  })
});
