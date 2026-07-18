import prisma from '../../config/db.js';

class PaymentRepository {
  async findByOrderId(orderId) {
    return prisma.payment.findUnique({
      where: { orderId },
      include: { customer: true }
    });
  }

  async create(data) {
    return prisma.payment.create({ data });
  }

  async findAll({ skip, take, where, orderBy }) {
    return prisma.$transaction([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          order: { include: { customer: true, securityDeposit: true, vehicle: true } }
        }
      })
    ]);
  }

  async findById(id) {
    return prisma.payment.findUnique({
      where: { id },
      include: {
        order: { include: { customer: true, securityDeposit: true, vehicle: true } }
      }
    });
  }

  async update(id, data) {
    return prisma.payment.update({
      where: { id },
      data
    });
  }

  async delete(id) {
    return prisma.payment.delete({
      where: { id }
    });
  }
}

export default new PaymentRepository();
