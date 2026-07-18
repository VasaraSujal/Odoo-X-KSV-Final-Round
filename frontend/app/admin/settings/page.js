'use client';

import { useCallback, useEffect, useState } from 'react';
import MasterPage from '@/components/master/MasterPage';
import SettingsForm from '@/components/settings/SettingsForm';
import ErrorState from '@/components/dashboard/ErrorState';
import PageLoader from '@/components/common/PageLoader';
import settingsService from '@/services/settingsService';
import { APP_ROUTES } from '@/constants/routes';
import { SETTINGS_DEFAULTS } from '@/lib/validations/settings';
import { getErrorMessage } from '@/lib/apiResponse';
import notify from '@/lib/toast';

const LOCAL_KEYS = {
  timezone: 'crms_org_timezone',
  logoUrl: 'crms_org_logo_url',
};

function readLocalExtras() {
  if (typeof window === 'undefined') return {};
  return {
    timezone: localStorage.getItem(LOCAL_KEYS.timezone) || 'Asia/Kolkata',
    logoUrl: localStorage.getItem(LOCAL_KEYS.logoUrl) || '',
  };
}

function writeLocalExtras({ timezone, logoUrl }) {
  if (typeof window === 'undefined') return;
  if (timezone) localStorage.setItem(LOCAL_KEYS.timezone, timezone);
  if (logoUrl != null) localStorage.setItem(LOCAL_KEYS.logoUrl, logoUrl);
}

export default function SettingsPage() {
  const [values, setValues] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await settingsService.getSettings();
      const data = result.data || {};
      setValues({
        ...SETTINGS_DEFAULTS,
        ...data,
        ...readLocalExtras(),
        taxPercentage: Number(data.taxPercentage ?? 0),
        graceHours: Number(data.graceHours ?? 0),
        lateFeePerHour: Number(data.lateFeePerHour ?? 0),
        lateFeePerDay: Number(data.lateFeePerDay ?? 0),
        maximumLateFee: Number(data.maximumLateFee ?? 0),
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onSubmit(formValues) {
    setSaving(true);
    try {
      const payload = {
        companyName: formValues.companyName,
        companyEmail: formValues.companyEmail,
        companyPhone: formValues.companyPhone || undefined,
        companyAddress: formValues.companyAddress || undefined,
        gstNumber: formValues.gstNumber || undefined,
        currency: formValues.currency,
        taxPercentage: Number(formValues.taxPercentage),
        invoicePrefix: formValues.invoicePrefix || undefined,
        depositRule: formValues.depositRule || undefined,
        graceHours: Number(formValues.graceHours),
        lateFeePerHour: Number(formValues.lateFeePerHour),
        lateFeePerDay: Number(formValues.lateFeePerDay),
        maximumLateFee: Number(formValues.maximumLateFee),
        quotationHeader: formValues.quotationHeader || undefined,
        quotationFooter: formValues.quotationFooter || undefined,
      };

      const result = await settingsService.updateSettings(payload);
      writeLocalExtras({
        timezone: formValues.timezone,
        logoUrl: formValues.logoUrl || '',
      });

      const saved = result.data || {};
      setValues({
        ...SETTINGS_DEFAULTS,
        ...saved,
        timezone: formValues.timezone,
        logoUrl: formValues.logoUrl || '',
        taxPercentage: Number(saved.taxPercentage ?? formValues.taxPercentage),
        graceHours: Number(saved.graceHours ?? formValues.graceHours),
        lateFeePerHour: Number(saved.lateFeePerHour ?? formValues.lateFeePerHour),
        lateFeePerDay: Number(saved.lateFeePerDay ?? formValues.lateFeePerDay),
        maximumLateFee: Number(saved.maximumLateFee ?? formValues.maximumLateFee),
      });

      notify.success(result.message || 'Settings saved successfully');
    } catch (err) {
      notify.error(getErrorMessage(err, 'Failed to save settings'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <MasterPage
      title="Organization Settings"
      description="Business identity, tax, invoice defaults, and rental policies"
      breadcrumbs={[
        { label: 'Admin', href: APP_ROUTES.ADMIN.ROOT },
        { label: 'Settings' },
      ]}
    >
      {loading ? (
        <PageLoader label="Loading settings…" />
      ) : error ? (
        <div className="surface-card">
          <ErrorState description={error} onRetry={load} />
        </div>
      ) : (
        <div className="mx-auto max-w-4xl">
          <SettingsForm
            defaultValues={values}
            onSubmit={onSubmit}
            loading={saving}
          />
        </div>
      )}
    </MasterPage>
  );
}
