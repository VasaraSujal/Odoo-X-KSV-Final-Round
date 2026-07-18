import prisma from '../../config/db.js';

class RentalPeriodRepository {
  async create(data) { return prisma.rentalPeriod.create({ data }); }
  async findAll() { return prisma.rentalPeriod.findMany(); }
  async findById(id) { return prisma.rentalPeriod.findUnique({ where: { id } }); }
  async findByName(name) { return prisma.rentalPeriod.findFirst({ where: { name } }); }
  async update(id, data) { return prisma.rentalPeriod.update({ where: { id }, data }); }
  async delete(id) { return prisma.rentalPeriod.delete({ where: { id } }); }
}
export default new RentalPeriodRepository();
