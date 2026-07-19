import sService from './stripe.service.js';
import catchAsync from '../../utils/catchAsync.js';
import ApiResponse from '../../utils/ApiResponse.js';

class StripeController {
  createPaymentIntent = catchAsync(async (req, res) => {
    const result = await sService.createPaymentIntent(req.body.rentalOrderId);
    res.status(200).json(new ApiResponse(200, result, 'Payment intent created successfully'));
  });

  createCheckoutSession = catchAsync(async (req, res) => {
    const { rentalOrderId, successUrl, cancelUrl } = req.body;
    const result = await sService.createCheckoutSession(rentalOrderId, successUrl, cancelUrl);
    res.status(200).json(new ApiResponse(200, result, 'Checkout session created successfully'));
  });

  cancelCheckout = catchAsync(async (req, res) => {
    const result = await sService.cancelCheckout(req.params.orderId);
    res.status(200).json(new ApiResponse(200, result, 'Checkout cancelled successfully'));
  });

  handleWebhook = async (req, res) => {
    const signature = req.headers['stripe-signature'];
    try {
      const result = await sService.handleWebhook(signature, req.rawBody || req.body);
      res.json(result);
    } catch (err) {
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  };

  getPayment = catchAsync(async (req, res) => {
    const result = await sService.getPayment(req.params.paymentId);
    res.status(200).json(new ApiResponse(200, result, 'Payment fetched successfully'));
  });

  refundPayment = catchAsync(async (req, res) => {
    const result = await sService.refundPayment(req.params.paymentId);
    res.status(200).json(new ApiResponse(200, result, 'Payment refunded successfully'));
  });
}

export default new StripeController();
