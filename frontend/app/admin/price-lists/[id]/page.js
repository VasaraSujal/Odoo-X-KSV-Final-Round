'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageLoader from '@/components/common/PageLoader';
import priceListService from '@/services/priceListService';
import { APP_ROUTES } from '@/constants/routes';

export default function PriceListDetailRedirectPage() {
  const { id } = useParams();
  const router = useRouter();

  useEffect(() => {
    let active = true;
    priceListService
      .getById(id)
      .then((result) => {
        if (!active) return;
        const vehicleId = result.data?.vehicleId || result.data?.vehicle?.id;
        router.replace(
          vehicleId
            ? APP_ROUTES.ADMIN.VEHICLE_DETAIL(vehicleId)
            : APP_ROUTES.ADMIN.VEHICLES
        );
      })
      .catch(() => {
        if (active) router.replace(APP_ROUTES.ADMIN.VEHICLES);
      });
    return () => {
      active = false;
    };
  }, [id, router]);

  return <PageLoader label="Redirecting to vehicle…" />;
}
