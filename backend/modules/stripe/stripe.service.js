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
      include: { payment: true, vehicle: true, securityDeposit: true }
    });
    if (!order) throw new ApiError(404, 'Rental Order not found');
    if (!order.payment) throw new ApiError(404, 'Payment record not found for this order');
    if (order.payment.paymentStatus === 'Paid') throw new ApiError(400, 'Order is already paid');

    // Pre-reserve the vehicle so no other customer can book it during payment
    await prisma.$transaction(async (tx) => {
      await tx.vehicle.update({
        where: { id: order.vehicleId },
        data: { status: 'Reserved' }
      });
      await tx.rentalOrder.update({
        where: { id: orderId },
        data: { orderStatus: 'Confirmed' }
      });
    });

    const balance = Number(order.payment.totalAmount);

    // Build line items with rental + tax + deposit breakdown
    const rentalAmount = Number(order.rentalAmount);
    const taxAmount = rentalAmount * 0.18;
    const depositAmount = Number(order.securityDeposit?.depositAmount || 0);

    const lineItems = [
      {
        price_data: {
          currency: 'inr',
          product_data: { name: `Rental Charge — Order #${order.orderNumber}` },
          unit_amount: Math.round(rentalAmount * 100)
        },
        quantity: 1,
      },
      {
        price_data: {
          currency: 'inr',
          product_data: { name: `GST (18%)` },
          unit_amount: Math.round(taxAmount * 100)
        },
        quantity: 1,
      },
    ];

    if (depositAmount > 0) {
      lineItems.push({
        price_data: {
          currency: 'inr',
          product_data: { name: `Security Deposit (Refundable)` },
          unit_amount: Math.round(depositAmount * 100)
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { orderId: order.id }
    });
    return { url: session.url, sessionId: session.id };
  }

  /**
   * Called when a customer cancels the Stripe checkout.
   * Rolls back the pre-reservation so the vehicle becomes available again.
   */
  async cancelCheckout(orderId) {
    const order = await prisma.rentalOrder.findUnique({
      where: { id: orderId },
      include: { payment: true }
    });
    if (!order) throw new ApiError(404, 'Rental order not found');

    // Only rollback if payment is still pending (not yet paid)
    if (order.payment && order.payment.paymentStatus === 'Paid') {
      throw new ApiError(400, 'Payment already completed, cannot cancel');
    }

    await prisma.$transaction(async (tx) => {
      await tx.rentalOrder.update({
        where: { id: orderId },
        data: { orderStatus: 'Pending' }
      });
      await tx.vehicle.update({
        where: { id: order.vehicleId },
        data: { status: 'Available' }
      });
    });

    return { message: 'Checkout cancelled, vehicle released' };
  }

  async handleWebhook(signature, rawBody) {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;

    // If no webhook secret is configured, parse the event directly (dev mode)
    if (!endpointSecret) {
      event = JSON.parse(typeof rawBody === 'string' ? rawBody : rawBody.toString());
    } else {
      try {
        event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
      } catch (err) {
        throw new ApiError(400, `Webhook Error: ${err.message}`);
      }
    }

    if (event.type === 'payment_intent.succeeded' || event.type === 'checkout.session.completed') {
      const data = event.data.object;
      const orderId = data.metadata?.orderId;
      
      if (orderId) {
        const transactionId = data.payment_intent || data.id;

        await prisma.$transaction(async (tx) => {
          // Update payment record
          await tx.payment.update({
            where: { orderId },
            data: {
              transactionId,
              paymentMethod: 'Card',
              paymentStatus: 'Paid',
              paymentDate: new Date()
            }
          });

          // Auto-confirm the order and reserve the vehicle
          const order = await tx.rentalOrder.findUnique({ where: { id: orderId } });
          if (order) {
            await tx.rentalOrder.update({
              where: { id: orderId },
              data: { orderStatus: 'Confirmed' }
            });
            await tx.vehicle.update({
              where: { id: order.vehicleId },
              data: { status: 'Reserved' }
            });
          }
        });
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
