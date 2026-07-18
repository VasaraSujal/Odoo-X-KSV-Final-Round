import vehicleRepository from './vehicles.repository.js';
import categoryRepository from '../categories/categories.repository.js';
import ApiError from '../../utils/ApiError.js';

class VehicleService {
  async create(data) {
    const category = await categoryRepository.findById(data.categoryId);
    if (!category) throw new ApiError(400, 'Invalid category ID');

    const existing = await vehicleRepository.findByRegistration(data.registrationNumber);
    if (existing) {
      throw new ApiError(400, 'Registration number already exists');
    }
    
    return vehicleRepository.create(data);
  }

  async getAll(query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where = {};
    if (query.brand) where.brand = { contains: query.brand, mode: 'insensitive' };
    if (query.model) where.model = { contains: query.model, mode: 'insensitive' };
    if (query.registrationNumber) where.registrationNumber = { contains: query.registrationNumber, mode: 'insensitive' };
    if (query.category) where.categoryId = query.category;
    if (query.fuelType) where.fuelType = query.fuelType;
    if (query.transmission) where.transmission = query.transmission;
    if (query.status) where.status = query.status;
    if (query.year) where.year = parseInt(query.year);

    let orderBy = {};
    if (query.sortBy) {
      const order = query.order === 'desc' ? 'desc' : 'asc';
      if (['brand', 'year', 'rentPerDay', 'createdAt'].includes(query.sortBy)) {
        orderBy[query.sortBy] = order;
      }
    } else {
      orderBy = { createdAt: 'desc' };
    }

    const [total, vehicles] = await vehicleRepository.findAll({ skip, take: limit, where, orderBy });
    return {
      vehicles,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async getById(id) {
    const vehicle = await vehicleRepository.findById(id);
    if (!vehicle) throw new ApiError(404, 'Vehicle not found');
    return vehicle;
  }

  async update(id, data) {
    const vehicle = await vehicleRepository.findById(id);
    if (!vehicle) throw new ApiError(404, 'Vehicle not found');

    if (data.categoryId) {
      const category = await categoryRepository.findById(data.categoryId);
      if (!category) throw new ApiError(400, 'Invalid category ID');
    }

    if (data.registrationNumber) {
      const existing = await vehicleRepository.findByRegistration(data.registrationNumber);
      if (existing && existing.id !== id) {
        throw new ApiError(400, 'Registration number already exists');
      }
    }

    return vehicleRepository.update(id, data);
  }

  async delete(id) {
    const vehicle = await vehicleRepository.findById(id);
    if (!vehicle) throw new ApiError(404, 'Vehicle not found');
    if (vehicle._count.rentalOrders > 0) {
      throw new ApiError(400, 'Cannot delete vehicle as it is linked to rental orders');
    }
    await vehicleRepository.delete(id);
    return true;
  }
}

export default new VehicleService();
