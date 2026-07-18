import prisma from '../../config/db.js';

class DashboardRepository {
  async getVehicleStats() {
    return prisma.$transaction([
      prisma.vehicle.count(),
      prisma.vehicle.count({ where: { status: 'Available' } }),
      prisma.vehicle.count({ where: { status: 'Reserved' } }),
      prisma.vehicle.count({ where: { status: 'Rented' } }),
      prisma.vehicle.count({ where: { status: 'Maintenance' } })
    ]);
  }

  async getCustomerCount() {
    return prisma.user.count({ where: { role: 'CUSTOMER' } });
  }

  async getRentalStats() {
    return prisma.$transaction([
      prisma.rentalOrder.count(),
      prisma.rentalOrder.count({ where: { orderStatus: 'Active' } }),
      prisma.rentalOrder.count({ where: { orderStatus: 'Completed' } }),
      prisma.rentalOrder.count({ where: { orderStatus: 'Cancelled' } }),
      prisma.rentalOrder.count({ where: { orderStatus: 'Pending' } })
    ]);
  }

  async getRevenueStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [total, todayRev, monthRev] = await prisma.$transaction([
      prisma.payment.aggregate({ _sum: { totalAmount: true }, where: { paymentStatus: 'Paid' } }),
      prisma.payment.aggregate({ _sum: { totalAmount: true }, where: { paymentStatus: 'Paid', paymentDate: { gte: today } } }),
      prisma.payment.aggregate({ _sum: { totalAmount: true }, where: { paymentStatus: 'Paid', paymentDate: { gte: firstDayOfMonth } } })
    ]);

    return {
      total: Number(total._sum.totalAmount || 0),
      today: Number(todayRev._sum.totalAmount || 0),
      month: Number(monthRev._sum.totalAmount || 0)
    };
  }
}

export default new DashboardRepository();
