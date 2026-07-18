'use client';

import { useCallback, useEffect, useState } from 'react';
import { User, Lock, Eye, EyeOff, Save } from 'lucide-react';
import MasterPage from '@/components/master/MasterPage';
import PageLoader from '@/components/common/PageLoader';
import { APP_ROUTES } from '@/constants/routes';
import userService from '@/services/userService';
import authService from '@/services/authService';
import { getErrorMessage } from '@/lib/apiResponse';
import notify from '@/lib/toast';

function FieldGroup({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-muted uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

export default function CustomerProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Profile form
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', drivingLicense: '' });

  // Password form
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userService.getProfile();
      const u = res.data;
      setUser(u);
      setForm({
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        phone: u.phone || '',
        drivingLicense: u.drivingLicense || '',
      });
    } catch (err) {
      notify.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSaveProfile(e) {
    e.preventDefault();
    if (!form.firstName.trim()) { notify.error('First name is required'); return; }
    setSaving(true);
    try {
      await userService.updateProfile(form);
      notify.success('Profile updated successfully');
      load();
    } catch (err) {
      notify.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (!passForm.currentPassword) { notify.error('Enter your current password'); return; }
    if (passForm.newPassword.length < 6) { notify.error('New password must be at least 6 characters'); return; }
    if (passForm.newPassword !== passForm.confirmPassword) { notify.error('Passwords do not match'); return; }

    setChangingPassword(true);
    try {
      await authService.changePassword({
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword,
      });
      notify.success('Password changed successfully');
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      notify.error(getErrorMessage(err));
    } finally {
      setChangingPassword(false);
    }
  }

  if (loading) return <PageLoader />;

  const TABS = [
    { key: 'profile', label: 'Personal Info', icon: User },
    { key: 'password', label: 'Change Password', icon: Lock },
  ];

  return (
    <MasterPage
      title="My Profile"
      description={user ? `${user.firstName} ${user.lastName}` : 'Manage your account'}
      breadcrumbs={[
        { label: 'Customer', href: APP_ROUTES.CUSTOMER.DASHBOARD },
        { label: 'Profile' },
      ]}
    >
      <div className="mx-auto max-w-xl">
        {/* Avatar / Header */}
        <div className="surface-card mb-5 flex items-center gap-4 p-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-2xl font-bold text-accent">
            {user?.firstName?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-bold text-primary">{user?.firstName} {user?.lastName}</p>
            <p className="text-sm text-muted">{user?.email}</p>
            <span className="mt-1 inline-block rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent uppercase">
              {user?.role}
            </span>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="mb-5 flex gap-1 rounded-2xl border border-border bg-surface p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-sm font-medium transition
                ${activeTab === tab.key ? 'bg-accent text-white shadow-sm' : 'text-muted hover:text-primary'}`}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="surface-card space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldGroup label="First Name">
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  className="input-field w-full"
                  required
                />
              </FieldGroup>
              <FieldGroup label="Last Name">
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  className="input-field w-full"
                />
              </FieldGroup>
            </div>
            <FieldGroup label="Phone">
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="input-field w-full"
              />
            </FieldGroup>
            <FieldGroup label="Driving License No.">
              <input
                type="text"
                value={form.drivingLicense}
                onChange={(e) => setForm((f) => ({ ...f, drivingLicense: e.target.value }))}
                className="input-field w-full"
                placeholder="e.g. GJ01-20251234567"
              />
            </FieldGroup>
            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-60"
              >
                <Save size={15} />
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <form onSubmit={handleChangePassword} className="surface-card space-y-4 p-6">
            <FieldGroup label="Current Password">
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={passForm.currentPassword}
                  onChange={(e) => setPassForm((f) => ({ ...f, currentPassword: e.target.value }))}
                  className="input-field w-full pr-10"
                  placeholder="Your current password"
                />
                <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </FieldGroup>
            <FieldGroup label="New Password">
              <input
                type="password"
                value={passForm.newPassword}
                onChange={(e) => setPassForm((f) => ({ ...f, newPassword: e.target.value }))}
                className="input-field w-full"
                placeholder="At least 6 characters"
                minLength={6}
              />
            </FieldGroup>
            <FieldGroup label="Confirm New Password">
              <input
                type="password"
                value={passForm.confirmPassword}
                onChange={(e) => setPassForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                className="input-field w-full"
                placeholder="Repeat new password"
              />
            </FieldGroup>
            <div className="pt-2">
              <button
                type="submit"
                disabled={changingPassword}
                className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-60"
              >
                <Lock size={15} />
                {changingPassword ? 'Updating…' : 'Change Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </MasterPage>
  );
}
