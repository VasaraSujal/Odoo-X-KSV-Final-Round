'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { XCircle, RotateCcw, ArrowLeft } from 'lucide-react';
import { APP_ROUTES } from '@/constants/routes';
import stripeService from '@/services/stripeService';

export default function PaymentCancelPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [rolledBack, setRolledBack] = useState(false);

  useEffect(() => {
    // Rollback the pre-reservation so the vehicle becomes available again
    if (orderId && !rolledBack) {
      stripeService.cancelCheckout(orderId)
        .then(() => setRolledBack(true))
        .catch(() => setRolledBack(true)); // even on error, show the page
    }
  }, [orderId, rolledBack]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-amber-50 p-4">
      <div className="w-full max-w-md text-center">
        {/* Cancel Icon */}
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-rose-100 shadow-lg shadow-rose-200/50">
          <XCircle size={48} className="text-rose-500" />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
        <p className="text-gray-500 text-sm mb-8">
          Your payment was not completed. The vehicle has been released back to the catalog.
          You can try again anytime from your booking page.
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          {orderId && (
            <Link
              href={APP_ROUTES.CUSTOMER.RENTAL_DETAIL(orderId)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-bold text-white shadow-lg shadow-accent/25 transition hover:brightness-110"
            >
              <RotateCcw size={16} /> Try Again
            </Link>
          )}
          <Link
            href={APP_ROUTES.CUSTOMER.RENTALS}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <ArrowLeft size={16} /> Back to My Rentals
          </Link>
        </div>
      </div>
    </div>
  );
}
