'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { changePasswordSchema } from '@/lib/validations/profile';
import authService from '@/services/authService';
import { getErrorMessage } from '@/lib/apiResponse';
import notify from '@/lib/toast';

export default function PasswordForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values) {
    try {
      const result = await authService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      notify.success(result.message || 'Password changed successfully');
      reset();
    } catch (error) {
      notify.error(getErrorMessage(error, 'Failed to change password'));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Input
        label="Current password"
        type="password"
        required
        autoComplete="current-password"
        error={errors.currentPassword?.message}
        {...register('currentPassword')}
      />
      <Input
        label="New password"
        type="password"
        required
        autoComplete="new-password"
        error={errors.newPassword?.message}
        {...register('newPassword')}
      />
      <Input
        label="Confirm new password"
        type="password"
        required
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />

      <div className="flex justify-end border-t border-border pt-4">
        <Button type="submit" variant="outline" loading={isSubmitting}>
          <KeyRound size={14} />
          Update password
        </Button>
      </div>
    </form>
  );
}
