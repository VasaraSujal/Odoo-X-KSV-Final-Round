import bcrypt from 'bcryptjs';
import authRepository from './auth.repository.js';
import ApiError from '../../utils/ApiError.js';
import generateToken from '../../utils/generateToken.js';

class AuthService {
  async register(data) {
    const existingUser = await authRepository.findUserByEmail(data.email);
    if (existingUser) {
      throw new ApiError(400, 'Email already registered');
    }
    
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await authRepository.createUser({
      ...data,
      password: hashedPassword,
      role: 'CUSTOMER',
      status: 'ACTIVE'
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(email, pass) {
    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      throw new ApiError(401, 'User account is not active');
    }

    const token = generateToken(user.id, user.email, user.role);
    const { password, ...userWithoutPassword } = user;
    
    return { user: userWithoutPassword, token };
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new ApiError(400, 'Current password is incorrect');
    }

    if (currentPassword === newPassword) {
      throw new ApiError(400, 'New password must be different from the current password');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await authRepository.updatePassword(userId, hashedPassword);

    return null;
  }
}

export default new AuthService();
