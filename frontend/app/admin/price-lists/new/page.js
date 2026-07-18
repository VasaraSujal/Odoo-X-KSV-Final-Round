'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PageLoader from '@/components/common/PageLoader';
import { APP_ROUTES } from '@/constants/routes';

function RedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const vehicleId = searchParams.get('vehicleId');
    router.replace(
      vehicleId
        ? APP_ROUTES.ADMIN.VEHICLE_DETAIL(vehicleId)
        : APP_ROUTES.ADMIN.VEHICLES
    );
  }, [router, searchParams]);

  return <PageLoader label="Redirecting…" />;
}

export default function NewPriceListRedirectPage() {
  return (
    <Suspense fallback={<PageLoader label="Redirecting…" />}>
      <RedirectInner />
    </Suspense>
  );
}
