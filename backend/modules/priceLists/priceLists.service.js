import plRepository from './priceLists.repository.js';
import vehicleRepository from '../vehicles/vehicles.repository.js';
import ApiError from '../../utils/ApiError.js';

class PriceListService {
  async create(data) {
    const vehicle = await vehicleRepository.findById(data.vehicleId);
    if (!vehicle) throw new ApiError(404, 'Vehicle not found');

    const overlapping = await plRepository.findOverlapping(
      data.vehicleId, data.pricingType, data.validFrom, data.validTo
    );
    if (overlapping) throw new ApiError(400, 'Overlapping active pricing periods for this vehicle and pricing type');

    return plRepository.create({
      ...data,
      validFrom: data.validFrom ? new Date(data.validFrom) : null,
      validTo: data.validTo ? new Date(data.validTo) : null
    });
  }

  async getAll() { return plRepository.findAll(); }

  async getById(id) {
    const pl = await plRepository.findById(id);
    if (!pl) throw new ApiError(404, 'Price list not found');
    return pl;
  }

  async update(id, data) {
    const pl = await plRepository.findById(id);
    if (!pl) throw new ApiError(404, 'Price list not found');

    const vId = data.vehicleId || pl.vehicleId;
    const pType = data.pricingType || pl.pricingType;
    const vFrom = data.validFrom !== undefined ? data.validFrom : pl.validFrom;
    const vTo = data.validTo !== undefined ? data.validTo : pl.validTo;

    if (data.vehicleId) {
      const vehicle = await vehicleRepository.findById(data.vehicleId);
      if (!vehicle) throw new ApiError(404, 'Vehicle not found');
    }

    const overlapping = await plRepository.findOverlapping(vId, pType, vFrom, vTo, id);
    if (overlapping) throw new ApiError(400, 'Overlapping active pricing periods for this vehicle and pricing type');

    const updateData = { ...data };
    if (data.validFrom !== undefined) updateData.validFrom = data.validFrom ? new Date(data.validFrom) : null;
    if (data.validTo !== undefined) updateData.validTo = data.validTo ? new Date(data.validTo) : null;

    return plRepository.update(id, updateData);
  }

  async delete(id) {
    const pl = await plRepository.findById(id);
    if (!pl) throw new ApiError(404, 'Price list not found');
    await plRepository.delete(id);
    return true;
  }
}
export default new PriceListService();
