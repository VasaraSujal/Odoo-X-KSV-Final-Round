import dRepository from './dashboard.repository.js';
import prisma from '../../config/db.js';

class DashboardService {
  async getOverview() {
    const [
      [totalVehicles, availableVehicles, reservedVehicles, rentedVehicles, maintenanceVehicles],
      totalCustomers,
      [totalRentals, activeRentals, completedRentals, cancelledRentals, pendingRentals],
      revenue
    ] = await Promise.all([
      dRepository.getVehicleStats(),
      dRepository.getCustomerCount(),
      dRepository.getRentalStats(),
      dRepository.getRevenueStats()
    ]);

    const paymentsStats = await prisma.payment.aggregate({
      _sum: { totalAmount: true },
      where: { paymentStatus: 'Pending' }
    });

    return {
      vehicles: {
        total: totalVehicles,
        available: availableVehicles,
        reserved: reservedVehicles,
        rented: rentedVehicles,
        maintenance: maintenanceVehicles
      },
      customers: { total: totalCustomers },
      rentals: {
        total: totalRentals,
        active: activeRentals,
        completed: completedRentals,
        cancelled: cancelledRentals,
        pending: pendingRentals
      },
      revenue: {
        total: revenue.total,
        today: revenue.today,
        monthly: revenue.month
      },
      payments: { pendingAmount: Number(paymentsStats._sum.totalAmount || 0) }
    };
  }

  async getRevenue() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(today.getDate() - today.getDay());
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);

    const [todayRev, weekRev, monthRev, yearRev] = await prisma.$transaction([
      prisma.payment.aggregate({ _sum: { totalAmount: true }, where: { paymentStatus: 'Paid', paymentDate: { gte: today } } }),
      prisma.payment.aggregate({ _sum: { totalAmount: true }, where: { paymentStatus: 'Paid', paymentDate: { gte: firstDayOfWeek } } }),
      prisma.payment.aggregate({ _sum: { totalAmount: true }, where: { paymentStatus: 'Paid', paymentDate: { gte: firstDayOfMonth } } }),
      prisma.payment.aggregate({ _sum: { totalAmount: true }, where: { paymentStatus: 'Paid', paymentDate: { gte: firstDayOfYear } } })
    ]);

    return {
      today: Number(todayRev._sum.totalAmount || 0),
      weekly: Number(weekRev._sum.totalAmount || 0),
      monthly: Number(monthRev._sum.totalAmount || 0),
      yearly: Number(yearRev._sum.totalAmount || 0)
    };
  }

  async getRentals() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [pickups, returns] = await prisma.$transaction([
      prisma.rentalOrder.count({ where: { pickupDate: { gte: today, lt: tomorrow } } }),
      prisma.rentalOrder.count({ where: { expectedReturnDate: { gte: today, lt: tomorrow } } })
    ]);

    return {
      todayPickups: pickups,
      todayReturns: returns
    };
  }

  async getVehicles() {
    const categories = await prisma.category.findMany({ include: { _count: { select: { vehicles: true } } } });
    const formatted = categories.map(c => ({ category: c.categoryName, count: c._count.vehicles }));
    return { byCategory: formatted };
  }

  async getPayments() {
    const [paid, pending, refunded] = await Promise.all([
      prisma.payment.aggregate({ _sum: { totalAmount: true }, where: { paymentStatus: 'Paid' } }),
      prisma.payment.aggregate({ _sum: { totalAmount: true }, where: { paymentStatus: 'Pending' } }),
      prisma.securityDeposit.aggregate({ _sum: { refundAmount: true } })
    ]);
    return {
      totalPaid: Number(paid._sum.totalAmount || 0),
      pendingAmount: Number(pending._sum.totalAmount || 0),
      refundAmount: Number(refunded._sum.refundAmount || 0)
    };
  }
}

export default new DashboardService();
