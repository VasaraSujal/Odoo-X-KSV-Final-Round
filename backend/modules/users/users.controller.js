import userService from './users.service.js';
import catchAsync from '../../utils/catchAsync.js';
import ApiResponse from '../../utils/ApiResponse.js';

class UserController {
  getProfile = catchAsync(async (req, res) => {
    const user = await userService.getProfile(req.user.id);
    res.status(200).json(new ApiResponse(200, user, 'Profile fetched successfully'));
  });

  updateProfile = catchAsync(async (req, res) => {
    const user = await userService.updateProfile(req.user.id, req.body);
    res.status(200).json(new ApiResponse(200, user, 'Profile updated successfully'));
  });

  getAllUsers = catchAsync(async (req, res) => {
    const result = await userService.getAllUsers(req.query);
    res.status(200).json(new ApiResponse(200, result, 'Users fetched successfully'));
  });

  getUserById = catchAsync(async (req, res) => {
    const user = await userService.getUserById(req.params.id);
    res.status(200).json(new ApiResponse(200, user, 'User fetched successfully'));
  });

  deleteUser = catchAsync(async (req, res) => {
    await userService.deleteUser(req.params.id);
    res.status(200).json(new ApiResponse(200, null, 'User deleted successfully'));
  });

  updateUser = catchAsync(async (req, res) => {
    const user = await userService.updateProfile(req.params.id, req.body);
    res.status(200).json(new ApiResponse(200, user, 'User updated successfully'));
  });
}

export default new UserController();
