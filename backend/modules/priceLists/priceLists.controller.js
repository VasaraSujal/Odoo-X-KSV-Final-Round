import plService from './priceLists.service.js';
import catchAsync from '../../utils/catchAsync.js';
import ApiResponse from '../../utils/ApiResponse.js';

class PriceListController {
  create = catchAsync(async (req, res) => {
    const pl = await plService.create(req.body);
    res.status(201).json(new ApiResponse(201, pl, 'Price list created successfully'));
  });
  getAll = catchAsync(async (req, res) => {
    const pls = await plService.getAll();
    res.status(200).json(new ApiResponse(200, pls, 'Price lists fetched successfully'));
  });
  getById = catchAsync(async (req, res) => {
    const pl = await plService.getById(req.params.id);
    res.status(200).json(new ApiResponse(200, pl, 'Price list fetched successfully'));
  });
  update = catchAsync(async (req, res) => {
    const pl = await plService.update(req.params.id, req.body);
    res.status(200).json(new ApiResponse(200, pl, 'Price list updated successfully'));
  });
  delete = catchAsync(async (req, res) => {
    await plService.delete(req.params.id);
    res.status(200).json(new ApiResponse(200, null, 'Price list deleted successfully'));
  });
}
export default new PriceListController();
