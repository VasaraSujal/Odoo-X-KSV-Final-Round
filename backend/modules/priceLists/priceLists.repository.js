import prisma from '../../config/db.js';

class PriceListRepository {
  async create(data) { return prisma.priceList.create({ data }); }
  async findAll() { return prisma.priceList.findMany({ include: { vehicle: true } }); }
  async findById(id) { return prisma.priceList.findUnique({ where: { id }, include: { vehicle: true } }); }
  async findOverlapping(vehicleId, pricingType, validFrom, validTo, excludeId = null) {
    const from = validFrom ? new Date(validFrom) : null;
    const to = validTo ? new Date(validTo) : null;

    return prisma.priceList.findFirst({
      where: {
        vehicleId,
        pricingType,
        id: excludeId ? { not: excludeId } : undefined,
        OR: [
          // Case 1: Existing list has NO dates (covers everything)
          { validFrom: null, validTo: null },
          // Case 2: New list has NO dates (covers everything) -> conflict if any existing exists
          ...(from === null && to === null ? [{}] : []),
          // Case 3: Overlapping dates logic
          ...(from && to ? [
            { validFrom: { lte: to }, validTo: { gte: from } },
            { validFrom: { lte: to }, validTo: null },
            { validFrom: null, validTo: { gte: from } }
          ] : []),
          ...(from && !to ? [
            { validTo: { gte: from } },
            { validTo: null }
          ] : []),
          ...(!from && to ? [
            { validFrom: { lte: to } },
            { validFrom: null }
          ] : []),
        ]
      }
    });
  }
  async update(id, data) { return prisma.priceList.update({ where: { id }, data }); }
  async delete(id) { return prisma.priceList.delete({ where: { id } }); }
}
export default new PriceListRepository();
