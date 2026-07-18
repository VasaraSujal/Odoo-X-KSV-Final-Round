import authService from './auth.service.js';
import catchAsync from '../../utils/catchAsync.js';
import ApiResponse from '../../utils/ApiResponse.js';

class AuthController {
  register = catchAsync(async (req, res) => {
    const user = await authService.register(req.body);
    res.status(201).json(new ApiResponse(201, user, 'User registered successfully'));
  });

  login = catchAsync(async (req, res) => {
    const { email, password } = req.body;
    const { user, token } = await authService.login(email, password);
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json(new ApiResponse(200, { user, token }, 'Login successful'));
  });

  me = catchAsync(async (req, res) => {
    const { password, ...user } = req.user;
    res.status(200).json(new ApiResponse(200, user, 'User profile fetched successfully'));
  });

  logout = catchAsync(async (req, res) => {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });
    res.status(200).json(new ApiResponse(200, null, 'Logout successful'));
  });

  changePassword = catchAsync(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user.id, currentPassword, newPassword);
    res
      .status(200)
      .json(new ApiResponse(200, null, 'Password changed successfully'));
  });
}

export default new AuthController();
