import prisma from '../../config/db.js';

class CategoryRepository {
  async create(data) {
    return prisma.category.create({ data });
  }
  async findAll() {
    return prisma.category.findMany();
  }
  async findById(id) {
    return prisma.category.findUnique({ where: { id }, include: { _count: { select: { vehicles: true } } } });
  }
  async findByCategoryName(categoryName) {
    return prisma.category.findUnique({ where: { categoryName } });
  }
  async update(id, data) {
    return prisma.category.update({ where: { id }, data });
  }
  async delete(id) {
    return prisma.category.delete({ where: { id } });
  }
}
export default new CategoryRepository();
