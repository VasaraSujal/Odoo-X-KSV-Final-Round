import roRepository from './rentalOrders.repository.js';
import prisma from '../../config/db.js';
import ApiError from '../../utils/ApiError.js';

class RentalOrderService {
  async create(data, user) {
    // If not admin, force customerId to be self
    if (user.role !== 'ADMIN') {
      data.customerId = user.id;
    }

    const customer = await prisma.user.findUnique({ where: { id: data.customerId } });
    if (!customer) throw new ApiError(404, 'Customer not found');

    const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
    if (!vehicle) throw new ApiError(404, 'Vehicle not found');
    if (vehicle.status !== 'Available') throw new ApiError(400, 'Vehicle is not available for booking');

    // Generate random 4-digit pickup OTP
    // const pickupOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const pickupOtp = "1234";


    // Calculate rentalAmount based on vehicle prices
    let rentRate = 0;
    switch (data.rentalUnit) {
      case 'Hour':
        rentRate = Number(vehicle.rentPerHour);
        break;
      case 'Day':
        rentRate = Number(vehicle.rentPerDay);
        break;
      case 'Week':
        rentRate = Number(vehicle.rentPerWeek);
        break;
      case 'Month':
        rentRate = Number(vehicle.rentPerMonth);
        break;
      default:
        throw new ApiError(400, 'Invalid rental unit');
    }

    const rentalAmount = rentRate * data.rentalDuration;
    const orderNumber = await roRepository.generateOrderNumber();

    const orderData = {
      orderNumber,
      customerId: data.customerId,
      vehicleId: data.vehicleId,
      pickupType: data.pickupType,
      deliveryAddressId: data.deliveryAddressId || null,
      pickupDate: new Date(data.pickupDate),
      expectedReturnDate: new Date(data.expectedReturnDate),
      rentalUnit: data.rentalUnit,
      rentalDuration: data.rentalDuration,
      rentalAmount,
      pickupOtp,
      pickupStatus: false,
      orderStatus: 'Pending',
      remarks: data.remarks || null,
    };

    return prisma.$transaction(async (tx) => {
      const order = await tx.rentalOrder.create({
        data: orderData,
        include: {
          customer: true,
          vehicle: true,
          deliveryAddress: true
        }
      });

      // Automatically create a pending Payment record for the checkout amount
      const taxAmount = rentalAmount * 0.18; // 18% tax
      const totalAmount = rentalAmount + taxAmount;
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          customerId: order.customerId,
          rentalAmount,
          taxAmount,
          totalAmount,
          paymentMethod: data.paymentMethod || 'UPI',
          transactionId: data.transactionId || null,
          paymentStatus: 'Pending'
        }
      });

      // Automatically create a held Security Deposit record
      const deposit = await tx.securityDeposit.create({
        data: {
          orderId: order.id,
          customerId: order.customerId,
          depositAmount: vehicle.securityDeposit,
          refundStatus: 'Pending',
          depositStatus: 'Held'
        }
      });

      return order;
    });
  }

  async getAll(query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where = {};
    if (query.orderNumber) where.orderNumber = { contains: query.orderNumber, mode: 'insensitive' };
    if (query.customerName) {
      where.customer = {
        OR: [
          { firstName: { contains: query.customerName, mode: 'insensitive' } },
          { lastName: { contains: query.customerName, mode: 'insensitive' } }
        ]
      };
    }
    if (query.customerId) where.customerId = query.customerId;
    if (query.orderStatus) where.orderStatus = query.orderStatus;
    if (query.pickupDate) where.pickupDate = { gte: new Date(query.pickupDate) };
    if (query.returnDate) where.expectedReturnDate = { lte: new Date(query.returnDate) };

    let orderBy = {};
    if (query.sortBy) {
      const order = query.order === 'asc' ? 'asc' : 'desc';
      if (['createdAt', 'pickupDate', 'rentalAmount'].includes(query.sortBy)) {
        orderBy[query.sortBy] = order;
      }
    } else {
      orderBy = { createdAt: 'desc' };
    }

    const [total, orders] = await roRepository.findAll({ skip, take: limit, where, orderBy });
    return {
      orders,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async getById(id) {
    const order = await roRepository.findById(id);
    if (!order) throw new ApiError(404, 'Rental order not found');
    return order;
  }

  async update(id, data) {
    const order = await roRepository.findById(id);
    if (!order) throw new ApiError(404, 'Rental order not found');
    if (order.orderStatus === 'Cancelled') throw new ApiError(400, 'Cancelled orders cannot be modified');
    if (order.orderStatus === 'Completed') throw new ApiError(400, 'Completed orders cannot be edited');

    const updateData = { ...data };
    if (data.pickupDate) updateData.pickupDate = new Date(data.pickupDate);
    if (data.expectedReturnDate) updateData.expectedReturnDate = new Date(data.expectedReturnDate);

    return roRepository.update(id, updateData);
  }

  async updateStatus(id, status, user) {
    const order = await roRepository.findById(id);
    if (!order) throw new ApiError(404, 'Rental order not found');
    if (order.orderStatus === 'Cancelled') throw new ApiError(400, 'Cancelled orders cannot be modified');
    if (order.orderStatus === 'Completed') throw new ApiError(400, 'Completed orders cannot be edited');

    if (status === 'Confirmed' && user.role !== 'ADMIN') {
      throw new ApiError(403, 'Only ADMIN can confirm bookings');
    }

    return prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.rentalOrder.update({
        where: { id },
        data: { orderStatus: status }
      });

      // If status becomes Confirmed, mark vehicle as Reserved
      if (status === 'Confirmed') {
        await tx.vehicle.update({
          where: { id: order.vehicleId },
          data: { status: 'Reserved' }
        });
      }

      // If status becomes Cancelled, release vehicle
      if (status === 'Cancelled') {
        await tx.vehicle.update({
          where: { id: order.vehicleId },
          data: { status: 'Available' }
        });
      }

      return updatedOrder;
    });
  }

  async pickup(id, data, user) {
    const order = await roRepository.findById(id);
    if (!order) throw new ApiError(404, 'Rental order not found');
    if (order.orderStatus !== 'Confirmed') {
      throw new ApiError(400, 'Only confirmed bookings can be picked up');
    }

    if (order.pickupOtp !== data.pickupOtp) {
      throw new ApiError(400, 'Invalid pickup OTP');
    }

    return prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.rentalOrder.update({
        where: { id },
        data: {
          pickupStatus: true,
          orderStatus: 'Active'
        }
      });

      await tx.vehicle.update({
        where: { id: order.vehicleId },
        data: { status: 'Rented' }
      });

      // Mark payment as paid on pickup verification (assuming payment made/settled)
      await tx.payment.updateMany({
        where: { orderId: id },
        data: { paymentStatus: 'Paid', paymentDate: new Date() }
      });

      return updatedOrder;
    });
  }

  async returnVehicle(id, data, user) {
    const order = await roRepository.findById(id);
    if (!order) throw new ApiError(404, 'Rental order not found');
    if (order.orderStatus !== 'Active') {
      throw new ApiError(400, 'Only active rentals can be returned');
    }

    if (user.role !== 'ADMIN') {
      throw new ApiError(403, 'Only ADMIN can perform return inspections');
    }

    const returnRemarks = data.returnRemarks || 'Returned and inspected successfully.';
    const penaltyAmount = Number(data.penaltyAmount || 0);

    return prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.rentalOrder.update({
        where: { id },
        data: {
          actualReturnDate: new Date(),
          returnCondition: data.returnCondition,
          returnRemarks,
          orderStatus: 'Completed'
        }
      });

      // Mark vehicle as Available again
      await tx.vehicle.update({
        where: { id: order.vehicleId },
        data: { status: 'Available' }
      });

      // Adjust Security Deposit based on penalty
      const deposit = await tx.securityDeposit.findUnique({ where: { orderId: id } });
      const depositAmount = Number(deposit?.depositAmount || 0);
      const refundAmount = Math.max(0, depositAmount - penaltyAmount);

      const updatedDeposit = await tx.securityDeposit.update({
        where: { orderId: id },
        data: {
          penaltyAmount,
          penaltyReason: data.penaltyReason || (penaltyAmount > 0 ? 'Deducted for return damages/delays' : null),
          refundAmount,
          refundStatus: penaltyAmount >= depositAmount ? 'Partially_Refunded' : 'Refunded',
          depositStatus: 'Released',
          refundDate: new Date()
        }
      });

      // Update or create final Invoice
      const taxAmount = Number(order.rentalAmount) * 0.18;
      const totalAmount = Number(order.rentalAmount) + taxAmount + penaltyAmount;

      const invoiceNumber = `INV-${order.orderNumber.split('-')[2] || id.slice(0, 8)}`;
      await tx.invoice.upsert({
        where: { orderId: id },
        create: {
          invoiceNumber,
          orderId: id,
          customerId: order.customerId,
          rentalAmount: order.rentalAmount,
          taxAmount,
          depositAmount: depositAmount,
          penaltyAmount,
          totalAmount,
          invoiceStatus: 'Paid',
        },
        update: {
          penaltyAmount,
          totalAmount,
          invoiceStatus: 'Paid',
        }
      });

      return updatedOrder;
    });
  }

  async delete(id) {
    const order = await roRepository.findById(id);
    if (!order) throw new ApiError(404, 'Rental order not found');
    if (order.orderStatus !== 'Pending' && order.orderStatus !== 'Cancelled') {
      throw new ApiError(400, 'Only pending or cancelled orders can be deleted');
    }
    await roRepository.delete(id);
    return true;
  }
}

export default new RentalOrderService();
