import prisma from '../../config/db.js';

class VehicleRepository {
  async create(data) {
    return prisma.vehicle.create({ data });
  }
  
  async findAll({ skip, take, where, orderBy }) {
    return prisma.$transaction([
      prisma.vehicle.count({ where }),
      prisma.vehicle.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          category: true,
          images: { where: { isPrimary: true } }
        }
      })
    ]);
  }
  
  async findById(id) {
    return prisma.vehicle.findUnique({
      where: { id },
      include: {
        category: true,
        images: true,
        _count: { select: { rentalOrders: true } }
      }
    });
  }
  
  async findByRegistration(registrationNumber) {
    return prisma.vehicle.findUnique({
      where: { registrationNumber }
    });
  }
  
  async update(id, data) {
    return prisma.vehicle.update({
      where: { id },
      data
    });
  }

  async delete(id) {
    return prisma.vehicle.delete({
      where: { id }
    });
  }
}

export default new VehicleRepository();
