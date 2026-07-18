import prisma from '../../config/db.js';

class AnalyticsService {
  async getRevenueTrend() {
    const trends = await prisma.payment.groupBy({
      by: ['paymentDate'],
      _sum: { totalAmount: true },
      where: { paymentStatus: 'Paid' },
      orderBy: { paymentDate: 'asc' }
    });
    // In a real app we format this into daily/weekly bins.
    return trends;
  }
  
  async getRentalTrend() {
    const trends = await prisma.rentalOrder.groupBy({
      by: ['createdAt'],
      _count: { id: true },
      orderBy: { createdAt: 'asc' }
    });
    return trends;
  }
}
export default new AnalyticsService();
