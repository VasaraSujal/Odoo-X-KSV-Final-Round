'use client';

import { useCallback, useEffect, useState } from 'react';
import { Mail, Phone, Shield, CalendarClock, Clock3 } from 'lucide-react';
import MasterPage from '@/components/master/MasterPage';
import ProfileForm from '@/components/profile/ProfileForm';
import PasswordForm from '@/components/profile/PasswordForm';
import ErrorState from '@/components/dashboard/ErrorState';
import PageLoader from '@/components/common/PageLoader';
import RoleBadge from '@/components/ui/RoleBadge';
import userService from '@/services/userService';
import { useAuth } from '@/hooks/useAuth';
import { APP_ROUTES } from '@/constants/routes';
import { getDisplayName } from '@/lib/auth';
import { formatDateTime } from '@/lib/format';
import { getErrorMessage } from '@/lib/apiResponse';
import notify from '@/lib/toast';

function MetaRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border/80 bg-slate-50/60 px-4 py-3">
      <span className="mt-0.5 text-muted">
        <Icon size={16} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium tracking-wide text-muted uppercase">
          {label}
        </p>
        <p className="mt-0.5 truncate text-sm font-medium text-primary">
          {value || '—'}
        </p>
      </div>
    </div>
  );
}

export default function AdminProfilePage() {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await userService.getProfile();
      setProfile(result.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onSubmit(values) {
    setSaving(true);
    try {
      const payload = {
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone || undefined,
        profileImage: values.profileImage || undefined,
      };

      const result = await userService.updateProfile(payload);
      const next = result.data || { ...profile, ...payload };
      setProfile(next);
      updateUser(next);
      notify.success(result.message || 'Profile updated');
    } catch (err) {
      notify.error(getErrorMessage(err, 'Failed to update profile'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <MasterPage
      title="Admin Profile"
      description="View and update your account details"
      breadcrumbs={[
        { label: 'Admin', href: APP_ROUTES.ADMIN.ROOT },
        { label: 'Profile' },
      ]}
    >
      {loading ? (
        <PageLoader label="Loading profile…" />
      ) : error ? (
        <div className="surface-card">
          <ErrorState description={error} onRetry={load} />
        </div>
      ) : (
        <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-[280px_1fr]">
          <aside className="surface-card h-fit space-y-4 p-5">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-primary">
                  {getDisplayName(profile)}
                </h2>
                <RoleBadge role={profile?.role} />
              </div>
              <p className="mt-1 text-xs text-muted">Account overview</p>
            </div>

            <div className="space-y-2">
              <MetaRow icon={Mail} label="Email" value={profile?.email} />
              <MetaRow icon={Phone} label="Phone" value={profile?.phone} />
              <MetaRow icon={Shield} label="Role" value={profile?.role} />
              <MetaRow
                icon={CalendarClock}
                label="Created"
                value={formatDateTime(profile?.createdAt)}
              />
              <MetaRow
                icon={Clock3}
                label="Last login"
                value={formatDateTime(profile?.lastLogin)}
              />
            </div>
          </aside>

          <div className="space-y-4">
            <section className="surface-card p-5 sm:p-6">
              <h3 className="text-sm font-semibold text-primary">Edit profile</h3>
              <p className="mt-1 mb-5 text-xs text-muted">
                Update your name, phone, and avatar. Email is managed by the
                authentication service and cannot be changed here.
              </p>
              <ProfileForm
                defaultValues={profile}
                onSubmit={onSubmit}
                loading={saving}
              />
            </section>

            <section className="surface-card p-5 sm:p-6">
              <h3 className="text-sm font-semibold text-primary">Change password</h3>
              <p className="mt-1 mb-5 text-xs text-muted">
                Enter your current password, then choose a new one (min. 6 characters).
              </p>
              <PasswordForm />
            </section>
          </div>
        </div>
      )}
    </MasterPage>
  );
}
