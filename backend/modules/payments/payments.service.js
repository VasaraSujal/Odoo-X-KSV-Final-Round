import pRepository from './payments.repository.js';
import prisma from '../../config/db.js';
import ApiError from '../../utils/ApiError.js';

class PaymentService {
  async createPayment(data, user) {
    const customerId = user.role === 'ADMIN' ? (data.customerId || user.id) : user.id;

    // Check if order exists
    const order = await prisma.rentalOrder.findUnique({ where: { id: data.orderId } });
    if (!order) throw new ApiError(404, 'Rental order not found');

    const rentalAmount = Number(data.rentalAmount || order.rentalAmount);
    const taxAmount = rentalAmount * 0.18;
    const totalAmount = rentalAmount + taxAmount;

    return pRepository.create({
      orderId: data.orderId,
      customerId,
      rentalAmount,
      taxAmount,
      totalAmount,
      paymentMethod: data.paymentMethod,
      transactionId: data.transactionId || null,
      paymentStatus: 'Pending'
    });
  }

  async processPayment(id, data, user) {
    const payment = await pRepository.findById(id);
    if (!payment) throw new ApiError(404, 'Payment record not found');
    if (user.role !== 'ADMIN' && payment.customerId !== user.id) {
      throw new ApiError(403, 'Not authorized');
    }

    return pRepository.update(id, {
      paymentMethod: data.paymentMethod,
      transactionId: data.transactionId,
      paymentStatus: 'Paid',
      paymentDate: new Date()
    });
  }

  async getAll(query, user) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const where = {};
    if (user.role !== 'ADMIN') {
      where.customerId = user.id;
    } else if (query.customerId) {
      where.customerId = query.customerId;
    }

    if (query.transactionId) {
      where.transactionId = { contains: query.transactionId, mode: 'insensitive' };
    }
    if (query.paymentStatus) where.paymentStatus = query.paymentStatus;
    if (query.paymentMethod) where.paymentMethod = query.paymentMethod;

    let orderBy = { createdAt: 'desc' };
    if (query.sortBy) {
      const order = query.order === 'asc' ? 'asc' : 'desc';
      if (['totalAmount', 'createdAt', 'paymentDate'].includes(query.sortBy)) {
        orderBy = { [query.sortBy]: order };
      }
    }

    const [total, payments] = await pRepository.findAll({
      skip,
      take: limit,
      where,
      orderBy,
    });

    return {
      payments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id, user) {
    const payment = await pRepository.findById(id);
    if (!payment) throw new ApiError(404, 'Payment not found');
    if (user.role !== 'ADMIN' && payment.customerId !== user.id) {
      throw new ApiError(403, 'Not authorized');
    }
    return payment;
  }

  async updateStatus(id, status) {
    const payment = await pRepository.findById(id);
    if (!payment) throw new ApiError(404, 'Payment not found');

    return pRepository.update(id, {
      paymentStatus: status,
      paymentDate: status === 'Paid' ? new Date() : null
    });
  }

  async delete(id) {
    const payment = await pRepository.findById(id);
    if (!payment) throw new ApiError(404, 'Payment not found');

    await pRepository.delete(id);
    return true;
  }
}

export default new PaymentService();
