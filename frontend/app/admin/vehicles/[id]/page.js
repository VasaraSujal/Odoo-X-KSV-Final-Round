'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import MasterPage from '@/components/master/MasterPage';
import StatusBadge from '@/components/master/StatusBadge';
import VehicleImageGallery from '@/components/master/VehicleImageGallery';
import VehiclePricingManager from '@/components/master/VehiclePricingManager';
import ImageUploader from '@/components/forms/ImageUploader';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Button from '@/components/ui/Button';
import PageLoader from '@/components/common/PageLoader';
import ErrorState from '@/components/dashboard/ErrorState';
import SectionHeader from '@/components/dashboard/SectionHeader';
import vehicleService from '@/services/vehicleService';
import vehicleImageService from '@/services/vehicleImageService';
import { APP_ROUTES } from '@/constants/routes';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { getErrorMessage } from '@/lib/apiResponse';
import notify from '@/lib/toast';

export default function VehicleDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await vehicleService.getVehicleById(id);
      setVehicle(result.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await vehicleService.remove(id);
      notify.success('Vehicle deleted');
      router.push(APP_ROUTES.ADMIN.VEHICLES);
    } catch (err) {
      notify.error(getErrorMessage(err));
      setConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  }

  async function handleUpload(file, { isPrimary, onUploadProgress }) {
    try {
      await vehicleImageService.upload(id, file, { isPrimary, onUploadProgress });
      notify.success('Image uploaded');
      await load();
    } catch (err) {
      notify.error(getErrorMessage(err));
      throw err;
    }
  }

  if (loading) {
    return (
      <MasterPage title="Vehicle Details" backHref={APP_ROUTES.ADMIN.VEHICLES}>
        <PageLoader />
      </MasterPage>
    );
  }

  if (error || !vehicle) {
    return (
      <MasterPage title="Vehicle Details" backHref={APP_ROUTES.ADMIN.VEHICLES}>
        <div className="surface-card">
          <ErrorState description={error || 'Not found'} onRetry={load} />
        </div>
      </MasterPage>
    );
  }

  const primaryImage =
    vehicle.images?.find((img) => img.isPrimary)?.imageUrl ||
    vehicle.images?.[0]?.imageUrl ||
    vehicle.thumbnail;

  return (
    <MasterPage
      title={`${vehicle.brand} ${vehicle.model}`}
      description={vehicle.registrationNumber}
      backHref={APP_ROUTES.ADMIN.VEHICLES}
      breadcrumbs={[
        { label: 'Admin', href: APP_ROUTES.ADMIN.ROOT },
        { label: 'Vehicles', href: APP_ROUTES.ADMIN.VEHICLES },
        { label: `${vehicle.brand} ${vehicle.model}` },
      ]}
      actions={
        <>
          <Link href={APP_ROUTES.ADMIN.VEHICLE_EDIT(id)}>
            <Button size="sm" variant="outline">
              <Pencil size={14} />
              Edit
            </Button>
          </Link>
          <Button size="sm" variant="danger" onClick={() => setConfirmOpen(true)}>
            <Trash2 size={14} />
            Delete
          </Button>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="surface-card overflow-hidden">
            {primaryImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={primaryImage}
                alt={`${vehicle.brand} ${vehicle.model}`}
                className="h-64 w-full object-cover sm:h-80"
              />
            ) : (
              <div className="flex h-64 items-center justify-center bg-slate-100 text-sm text-muted sm:h-80">
                No primary image
              </div>
            )}
            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <Detail label="Category" value={vehicle.category?.name} />
              <Detail
                label="Availability"
                value={<StatusBadge status={vehicle.availabilityStatus} />}
              />
              <Detail label="Variant" value={vehicle.variant} />
              <Detail label="Year" value={vehicle.year} />
              <Detail label="VIN" value={vehicle.vin} />
              <Detail label="Color" value={vehicle.color} />
              <Detail label="Fuel" value={vehicle.fuelType} />
              <Detail label="Transmission" value={vehicle.transmission} />
              <Detail label="Seats" value={vehicle.seatCapacity} />
              <Detail label="Mileage" value={vehicle.mileage} />
              <Detail label="Base Price" value={formatCurrency(vehicle.basePrice)} />
              <Detail
                label="Security Deposit"
                value={formatCurrency(vehicle.securityDeposit)}
              />
              <Detail label="Current Status" value={vehicle.currentStatus} />
              <Detail label="Created" value={formatDateTime(vehicle.createdAt)} />
            </div>
            {vehicle.description ? (
              <div className="border-t border-border px-6 py-5">
                <p className="text-xs font-medium tracking-wide text-muted uppercase">
                  Description
                </p>
                <p className="mt-2 text-sm leading-relaxed text-secondary">
                  {vehicle.description}
                </p>
              </div>
            ) : null}
          </div>

          <VehiclePricingManager
            vehicleId={id}
            priceLists={vehicle.priceLists || []}
            onChanged={load}
          />
        </div>

        <div className="space-y-6">
          <div className="surface-card p-6">
            <SectionHeader
              title="Vehicle Images"
              description="Upload, preview, set primary, and delete"
            />
            <ImageUploader onUpload={handleUpload} />
            <div className="mt-6">
              <VehicleImageGallery
                vehicleId={id}
                images={vehicle.images || []}
                onChanged={load}
              />
            </div>
          </div>

          <div className="surface-card p-6">
            <p className="text-xs font-medium tracking-wide text-muted uppercase">
              Rental Linkage
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-primary">
              {vehicle._count?.rentalItems ?? 0}
            </p>
            <p className="mt-1 text-sm text-muted">
              Linked rental items — deletion is blocked when this is greater than zero.
            </p>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete vehicle?"
        description={`Delete ${vehicle.brand} ${vehicle.model}?`}
      />
    </MasterPage>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-medium tracking-wide text-muted uppercase">{label}</p>
      <div className="mt-1 text-sm font-medium text-primary">{value || '—'}</div>
    </div>
  );
}
