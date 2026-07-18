import { z } from 'zod';

export const createRentalOrderSchema = z.object({
  body: z.object({
    customerId: z.string().uuid('Invalid customer ID').optional(),
    vehicleId: z.string().uuid('Invalid vehicle ID'),
    pickupType: z.enum(['Store_Pickup', 'Home_Delivery']),
    deliveryAddressId: z.string().uuid().optional().nullable(),
    pickupDate: z.string().datetime(),
    expectedReturnDate: z.string().datetime(),
    rentalUnit: z.enum(['Hour', 'Day', 'Week', 'Month']),
    rentalDuration: z.number().int().positive(),
    remarks: z.string().optional().nullable(),
    paymentMethod: z.enum(['Cash', 'Card', 'UPI', 'Net_Banking']).default('UPI'),
    transactionId: z.string().optional().nullable()
  })
}).refine(data => new Date(data.body.pickupDate) > new Date(Date.now() - 86400000), {
  message: 'Pickup date cannot be in the past',
  path: ['body', 'pickupDate']
}).refine(data => new Date(data.body.expectedReturnDate) > new Date(data.body.pickupDate), {
  message: 'Expected return date must be after pickup date',
  path: ['body', 'expectedReturnDate']
});

export const updateRentalOrderSchema = z.object({
  body: z.object({
    pickupDate: z.string().datetime().optional(),
    expectedReturnDate: z.string().datetime().optional(),
    deliveryAddressId: z.string().uuid().optional().nullable(),
    remarks: z.string().optional().nullable()
  })
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum([
      'Pending',
      'Confirmed',
      'Ready_for_Pickup',
      'Picked_Up',
      'Active',
      'Return_Pending',
      'Returned',
      'Inspection',
      'Refund_Pending',
      'Completed',
      'Cancelled'
    ])
  })
});

export const pickupOrderSchema = z.object({
  body: z.object({
    pickupOtp: z.string().min(4, 'OTP must be at least 4 digits')
  })
});

export const returnOrderSchema = z.object({
  body: z.object({
    returnCondition: z.enum(['Good', 'Damaged']),
    returnRemarks: z.string().optional().nullable(),
    penaltyAmount: z.number().nonnegative().optional(),
    penaltyReason: z.string().optional().nullable()
  })
});
