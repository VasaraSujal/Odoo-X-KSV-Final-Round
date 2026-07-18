'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageLoader from '@/components/common/PageLoader';
import { APP_ROUTES } from '@/constants/routes';

/** Price lists are managed from the Vehicle detail page. */
export default function PriceListsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(APP_ROUTES.ADMIN.VEHICLES);
  }, [router]);

  return <PageLoader label="Redirecting to Vehicles…" />;
}
