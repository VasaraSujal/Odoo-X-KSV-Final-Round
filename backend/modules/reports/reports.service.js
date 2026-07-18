import prisma from '../../config/db.js';

class ReportsService {
  async getRentalReport(query) {
    const where = {};
    if (query.startDate && query.endDate) {
      where.createdAt = { gte: new Date(query.startDate), lte: new Date(query.endDate) };
    }
    if (query.status) where.orderStatus = query.status;

    const rentals = await prisma.rentalOrder.findMany({
      where,
      include: {
        customer: true,
        vehicle: { include: { category: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return rentals;
  }
  
  async getRevenueReport(query) {
    const where = { paymentStatus: 'Paid' };
    if (query.startDate && query.endDate) {
      where.paymentDate = { gte: new Date(query.startDate), lte: new Date(query.endDate) };
    }
    
    const payments = await prisma.payment.findMany({
      where,
      include: {
        order: {
          include: { customer: true },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });
    return payments;
  }

  async getExportData(type, query) {
    if (type === 'rentals') return this.getRentalReport(query);
    if (type === 'revenue') return this.getRevenueReport(query);
    return [];
  }
}

export default new ReportsService();
