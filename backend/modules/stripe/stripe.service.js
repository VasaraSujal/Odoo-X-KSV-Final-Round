import Stripe from 'stripe';
import prisma from '../../config/db.js';
import ApiError from '../../utils/ApiError.js';
import dotenv from 'dotenv';
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

class StripeService {
  async createPaymentIntent(orderId) {
    const payment = await prisma.payment.findUnique({
      where: { orderId }
    });
    if (!payment) throw new ApiError(404, 'Payment record not found for this order');
    if (payment.paymentStatus === 'Paid') throw new ApiError(400, 'Order is already paid');

    const balance = Number(payment.totalAmount);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(balance * 100), // Stripe expects cents
      currency: 'inr',
      metadata: { orderId }
    });

    return { clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id };
  }

  async createCheckoutSession(orderId, successUrl, cancelUrl) {
    const order = await prisma.rentalOrder.findUnique({
      where: { id: orderId },
      include: { payment: true }
    });
    if (!order) throw new ApiError(404, 'Rental Order not found');
    if (!order.payment) throw new ApiError(404, 'Payment record not found for this order');
    if (order.payment.paymentStatus === 'Paid') throw new ApiError(400, 'Order is already paid');

    const balance = Number(order.payment.totalAmount);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'inr',
          product_data: { name: `Rental Order #${order.orderNumber}` },
          unit_amount: Math.round(balance * 100)
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { orderId: order.id }
    });
    return { url: session.url, sessionId: session.id };
  }

  async handleWebhook(signature, rawBody) {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
    } catch (err) {
      throw new ApiError(400, `Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded' || event.type === 'checkout.session.completed') {
      const data = event.data.object;
      const orderId = data.metadata?.orderId;
      
      if (orderId) {
        const transactionId = data.payment_intent || data.id;
        const existing = await prisma.payment.findUnique({ where: { transactionId } });
        
        if (!existing) {
          await prisma.payment.update({
            where: { orderId },
            data: {
              transactionId,
              paymentMethod: 'Card',
              paymentStatus: 'Paid',
              paymentDate: new Date()
            }
          });
        }
      }
    }
    return { received: true };
  }

  async getPayment(paymentId) {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new ApiError(404, 'Payment not found');
    return payment;
  }

  async refundPayment(paymentId) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true }
    });
    if (!payment) throw new ApiError(404, 'Payment not found');
    if (!payment.transactionId) throw new ApiError(400, 'Cannot refund non-stripe payment via this endpoint');
    
    // Process Stripe Refund
    const refund = await stripe.refunds.create({ payment_intent: payment.transactionId });

    return prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: { paymentStatus: 'Refunded' }
      });

      return { refundId: refund.id, status: refund.status, payment: updatedPayment };
    });
  }
}

export default new StripeService();
