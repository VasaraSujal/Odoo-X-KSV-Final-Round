import api from '@/services/axios';
import { API_ROUTES } from '@/constants/apiRoutes';
import { parseApiResponse } from '@/lib/apiResponse';

const stripeService = {
  async createPaymentIntent(rentalOrderId) {
    const response = await api.post(API_ROUTES.STRIPE.CREATE_PAYMENT_INTENT, {
      rentalOrderId,
    });
    return parseApiResponse(response);
  },

  async createCheckoutSession(rentalOrderId, { successUrl, cancelUrl }) {
    const response = await api.post(API_ROUTES.STRIPE.CREATE_CHECKOUT_SESSION, {
      rentalOrderId,
      successUrl,
      cancelUrl,
    });
    return parseApiResponse(response);
  },

  async cancelCheckout(orderId) {
    const response = await api.post(API_ROUTES.STRIPE.CANCEL_CHECKOUT(orderId));
    return parseApiResponse(response);
  },

  async getPayment(paymentId) {
    const response = await api.get(API_ROUTES.STRIPE.PAYMENT(paymentId));
    return parseApiResponse(response);
  },

  async refund(paymentId) {
    const response = await api.post(API_ROUTES.STRIPE.REFUND(paymentId));
    return parseApiResponse(response);
  },
};

export default stripeService;
