import rpRepository from './rentalPeriods.repository.js';
import ApiError from '../../utils/ApiError.js';

class RentalPeriodService {
  async create(data) {
    const exists = await rpRepository.findByName(data.name);
    if (exists) throw new ApiError(400, 'Rental period name already exists');
    return rpRepository.create(data);
  }
  async getAll() {
    return rpRepository.findAll();
  }
  async getById(id) {
    const rp = await rpRepository.findById(id);
    if (!rp) throw new ApiError(404, 'Rental period not found');
    return rp;
  }
  async update(id, data) {
    const rp = await rpRepository.findById(id);
    if (!rp) throw new ApiError(404, 'Rental period not found');
    if (data.name && data.name !== rp.name) {
      const exists = await rpRepository.findByName(data.name);
      if (exists) throw new ApiError(400, 'Rental period name already exists');
    }
    return rpRepository.update(id, data);
  }
  async delete(id) {
    const rp = await rpRepository.findById(id);
    if (!rp) throw new ApiError(404, 'Rental period not found');
    // Assuming no restriction on deletion mentioned beyond normal admin
    await rpRepository.delete(id);
    return true;
  }
}
export default new RentalPeriodService();
