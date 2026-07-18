import prisma from '../../config/db.js';

class ReportsService {
  async getRentalReport(query) {
    const where = {};
    if (query.startDate && query.endDate) {
      where.createdAt = { gte: new Date(query.startDate), lte: new Date(query.endDate) };
    }
    if (query.status) where.status = query.status;

    const rentals = await prisma.rentalOrder.findMany({
      where,
      include: { customer: true, rentalItems: { include: { vehicle: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return rentals;
  }
  
  async getRevenueReport(query) {
    const where = { paymentStatus: 'SUCCESS' };
    if (query.startDate && query.endDate) {
      where.paidAt = { gte: new Date(query.startDate), lte: new Date(query.endDate) };
    }
    
    const payments = await prisma.payment.findMany({
      where,
      include: {
        rentalOrder: {
          include: { customer: true },
        },
      },
      orderBy: { paidAt: 'desc' },
    });
    return payments;
  }

  // Generic data export handler mapping
  async getExportData(type, query) {
    if (type === 'rentals') return this.getRentalReport(query);
    if (type === 'revenue') return this.getRevenueReport(query);
    return [];
  }
}
export default new ReportsService();
