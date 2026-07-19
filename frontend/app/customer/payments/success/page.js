'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, ArrowRight, Car } from 'lucide-react';
import { APP_ROUTES } from '@/constants/routes';
import rentalService from '@/services/rentalService';
import paymentService from '@/services/paymentService';
import securityDepositService from '@/services/securityDepositService';
import { formatCurrency, formatDate } from '@/lib/format';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [deposit, setDeposit] = useState(null);

  useEffect(() => {
    if (!orderId) return;

    // Fetch order, payment, and deposit in parallel
    Promise.all([
      rentalService.getRentalOrderById(orderId).catch(() => null),
      paymentService.getPayments({ orderId, limit: 1 }).catch(() => null),
      securityDepositService.getDeposits
        ? securityDepositService.getDeposits({ orderId, limit: 1 }).catch(() => null)
        : Promise.resolve(null),
    ]).then(([orderRes, payRes, depRes]) => {
      if (orderRes) setOrder(orderRes.data);
      if (payRes) {
        const list = payRes.data?.payments || [];
        setPayment(list[0] || null);
      }
      if (depRes) {
        const list = depRes.data?.securityDeposits || depRes.data?.deposits || [];
        setDeposit(Array.isArray(list) ? list[0] : list);
      }
    });
  }, [orderId]);

  // Derive amounts
  const rentalAmount = Number(payment?.rentalAmount || order?.rentalAmount || 0);
  const taxAmount = Number(payment?.taxAmount || 0);
  const depositAmount = Number(deposit?.depositAmount || 0);
  const totalPaid = Number(payment?.totalAmount || 0);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-50 p-4">
      <div className="w-full max-w-md text-center">
        {/* Success Icon */}
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 shadow-lg shadow-emerald-200/50">
          <CheckCircle size={48} className="text-emerald-600" />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-500 text-sm mb-8">
          Your booking has been confirmed and the vehicle is now reserved for you.
        </p>

        {/* Order Summary Card */}
        {order && (
          <div className="mb-8 rounded-2xl border border-emerald-200 bg-white p-5 text-left shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                <Car size={18} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">
                  {order.vehicle?.brand} {order.vehicle?.model}
                </p>
                <p className="text-xs text-gray-500">
                  Booking #{order.orderNumber}
                </p>
              </div>
            </div>

            <div className="space-y-2 border-t border-gray-100 pt-3">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Rental Charge</span>
                <span className="font-semibold text-gray-900">{formatCurrency(rentalAmount)}</span>
              </div>
              {taxAmount > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">GST (18%)</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(taxAmount)}</span>
                </div>
              )}
              {depositAmount > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Security Deposit</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(depositAmount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-100 pt-2 text-sm">
                <span className="font-bold text-gray-900">Total Paid</span>
                <span className="font-bold text-emerald-600">{formatCurrency(totalPaid)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Status</span>
                <span className="font-semibold text-emerald-600">{order.orderStatus}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {orderId && (
            <Link
              href={APP_ROUTES.CUSTOMER.RENTAL_DETAIL(orderId)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-300/40 transition hover:bg-emerald-700"
            >
              View Booking Details <ArrowRight size={16} />
            </Link>
          )}
          <Link
            href={APP_ROUTES.CUSTOMER.RENTALS}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            My Rentals
          </Link>
        </div>
      </div>
    </div>
  );
}
