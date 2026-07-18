'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import SectionHeader from '@/components/dashboard/SectionHeader';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import priceListService from '@/services/priceListService';
import { priceListSchema } from '@/lib/validations/masterData';
import { PRICING_TYPE_OPTIONS } from '@/constants/masterData';
import { toDateInputValue, toIsoDateTime } from '@/lib/listUtils';
import { formatCurrency, formatDate } from '@/lib/format';
import { getErrorMessage } from '@/lib/apiResponse';
import notify from '@/lib/toast';

export default function VehiclePricingManager({
  vehicleId,
  priceLists = [],
  onChanged,
}) {
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(priceListSchema),
    defaultValues: {
      vehicleId,
      pricingType: '',
      price: '',
      validFrom: '',
      validTo: '',
    },
  });

  useEffect(() => {
    if (!modal) return;
    if (modal.mode === 'create') {
      reset({
        vehicleId,
        pricingType: '',
        price: '',
        validFrom: '',
        validTo: '',
      });
      return;
    }
    reset({
      vehicleId,
      pricingType: modal.entry.pricingType || '',
      price: modal.entry.price ?? '',
      validFrom: toDateInputValue(modal.entry.validFrom),
      validTo: toDateInputValue(modal.entry.validTo),
    });
  }, [modal, reset, vehicleId]);

  async function onSubmit(values) {
    setBusy(true);
    try {
      const payload = {
        vehicleId,
        pricingType: values.pricingType,
        price: Number(values.price),
        validFrom: values.validFrom ? toIsoDateTime(values.validFrom) : null,
        validTo: values.validTo ? toIsoDateTime(values.validTo) : null,
      };

      if (modal?.mode === 'edit') {
        const result = await priceListService.update(modal.entry.id, payload);
        notify.success(result.message || 'Pricing updated');
      } else {
        const result = await priceListService.create(payload);
        notify.success(result.message || 'Pricing added');
      }

      setModal(null);
      await onChanged?.();
    } catch (err) {
      notify.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await priceListService.remove(deleteTarget.id);
      notify.success('Pricing removed');
      setDeleteTarget(null);
      await onChanged?.();
    } catch (err) {
      notify.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="surface-card p-6">
      <SectionHeader
        title="Pricing"
        description="Manage rates for this vehicle"
        action={
          <Button size="sm" onClick={() => setModal({ mode: 'create' })}>
            <Plus size={14} />
            Add price
          </Button>
        }
      />

      {!priceLists.length ? (
        <p className="mt-4 text-sm text-muted">
          No pricing entries yet. Add hourly, daily, or other rates for this vehicle.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {priceLists.map((pl) => (
            <li
              key={pl.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-primary">{pl.pricingType}</p>
                <p className="text-xs text-muted">
                  {pl.validFrom || pl.validTo
                    ? `${formatDate(pl.validFrom) || '—'} → ${formatDate(pl.validTo) || '—'}`
                    : 'No validity window'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tabular-nums text-secondary">
                  {formatCurrency(pl.price)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Edit pricing"
                  onClick={() => setModal({ mode: 'edit', entry: pl })}
                >
                  <Pencil size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-danger"
                  aria-label="Delete pricing"
                  onClick={() => setDeleteTarget(pl)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={Boolean(modal)}
        onClose={() => !busy && setModal(null)}
        title={modal?.mode === 'edit' ? 'Edit pricing' : 'Add pricing'}
        description="Rates are saved against this vehicle only."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <input type="hidden" {...register('vehicleId')} />
          <Select
            label="Pricing type"
            required
            options={PRICING_TYPE_OPTIONS}
            error={errors.pricingType?.message}
            {...register('pricingType')}
          />
          <Input
            label="Price"
            type="number"
            step="0.01"
            min="0"
            required
            error={errors.price?.message}
            {...register('price')}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Valid from"
              type="date"
              error={errors.validFrom?.message}
              {...register('validFrom')}
            />
            <Input
              label="Valid to"
              type="date"
              error={errors.validTo?.message}
              {...register('validTo')}
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModal(null)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="submit" loading={busy}>
              {modal?.mode === 'edit' ? 'Save changes' : 'Add price'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={busy}
        title="Remove pricing?"
        description={`Delete ${deleteTarget?.pricingType} rate of ${formatCurrency(deleteTarget?.price)}?`}
        confirmLabel="Delete"
        tone="danger"
      />
    </div>
  );
}
