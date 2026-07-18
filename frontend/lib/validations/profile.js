import { z } from 'zod';

export const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(60),
  lastName: z.string().min(1, 'Last name is required').max(60),
  phone: z.string().max(30).optional().or(z.literal('')),
  profileImage: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (val) =>
        !val ||
        val.startsWith('data:image/') ||
        /^https?:\/\//i.test(val),
      'Enter a valid image URL or upload an image'
    ),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(6, 'New password must be at least 6 characters')
      .max(72, 'Password is too long'),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
