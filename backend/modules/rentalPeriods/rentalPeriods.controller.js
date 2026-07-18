import rpService from './rentalPeriods.service.js';
import catchAsync from '../../utils/catchAsync.js';
import ApiResponse from '../../utils/ApiResponse.js';

class RentalPeriodController {
  create = catchAsync(async (req, res) => {
    const rp = await rpService.create(req.body);
    res.status(201).json(new ApiResponse(201, rp, 'Rental period created successfully'));
  });
  getAll = catchAsync(async (req, res) => {
    const rps = await rpService.getAll();
    res.status(200).json(new ApiResponse(200, rps, 'Rental periods fetched successfully'));
  });
  getById = catchAsync(async (req, res) => {
    const rp = await rpService.getById(req.params.id);
    res.status(200).json(new ApiResponse(200, rp, 'Rental period fetched successfully'));
  });
  update = catchAsync(async (req, res) => {
    const rp = await rpService.update(req.params.id, req.body);
    res.status(200).json(new ApiResponse(200, rp, 'Rental period updated successfully'));
  });
  delete = catchAsync(async (req, res) => {
    await rpService.delete(req.params.id);
    res.status(200).json(new ApiResponse(200, null, 'Rental period deleted successfully'));
  });
}
export default new RentalPeriodController();
