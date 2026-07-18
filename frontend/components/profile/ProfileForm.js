'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Camera, Save } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { profileSchema } from '@/lib/validations/profile';
import { getInitials } from '@/lib/auth';
import notify from '@/lib/toast';

export default function ProfileForm({
  defaultValues,
  onSubmit,
  loading = false,
}) {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(defaultValues?.profileImage || '');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      profileImage: '',
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (defaultValues) {
      reset({
        firstName: defaultValues.firstName || '',
        lastName: defaultValues.lastName || '',
        phone: defaultValues.phone || '',
        profileImage: defaultValues.profileImage || '',
      });
      setPreview(defaultValues.profileImage || '');
    }
  }, [defaultValues, reset]);

  const profileImage = watch('profileImage');

  useEffect(() => {
    setPreview(profileImage || '');
  }, [profileImage]);

  function onPickFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify.error('Please select an image file');
      return;
    }

    if (file.size > 1.5 * 1024 * 1024) {
      notify.error('Image must be under 1.5 MB for URL storage');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      setValue('profileImage', dataUrl, { shouldDirty: true, shouldValidate: true });
      setPreview(dataUrl);
      notify.info('Avatar ready — save profile to apply');
    };
    reader.readAsDataURL(file);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="relative">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Profile avatar"
              className="h-20 w-20 rounded-2xl border border-border object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-[var(--color-accent-hover)] text-lg font-semibold text-white">
              {getInitials(defaultValues)}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute -right-1 -bottom-1 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-white text-secondary shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            aria-label="Upload avatar"
          >
            <Camera size={14} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPickFile}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-primary">Profile photo</p>
          <p className="mt-1 text-xs text-muted">
            Upload an image or paste a hosted URL. There is no dedicated avatar
            upload API — the image is stored as a profile image string.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="First name"
          required
          error={errors.firstName?.message}
          {...register('firstName')}
        />
        <Input
          label="Last name"
          required
          error={errors.lastName?.message}
          {...register('lastName')}
        />
        <Input
          label="Phone"
          error={errors.phone?.message}
          {...register('phone')}
        />
        <Input
          label="Avatar URL"
          placeholder="https://…"
          error={errors.profileImage?.message}
          {...register('profileImage')}
        />
      </div>

      <div className="flex justify-end border-t border-border pt-4">
        <Button type="submit" loading={loading} disabled={loading}>
          <Save size={14} />
          Save profile
        </Button>
      </div>
    </form>
  );
}
