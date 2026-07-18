import userRepository from './users.repository.js';
import ApiError from '../../utils/ApiError.js';

class UserService {
  async getProfile(id) {
    const user = await userRepository.findById(id);
    if (!user) throw new ApiError(404, 'User not found');
    return user;
  }

  async updateProfile(id, data) {
    return userRepository.update(id, data);
  }

  async getAllUsers(query = {}) {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 50, 100);
    const skip = (page - 1) * limit;

    const where = {};
    if (query.role) where.role = query.role;
    if (query.accountStatus) where.accountStatus = query.accountStatus;
    
    if (query.search) {
      const q = String(query.search).trim();
      if (q) {
        where.OR = [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q, mode: 'insensitive' } },
        ];
      }
    }

    let orderBy = { createdAt: 'desc' };
    if (query.sortBy) {
      const order = query.order === 'asc' ? 'asc' : 'desc';
      if (['createdAt', 'firstName', 'lastName', 'email'].includes(query.sortBy)) {
        orderBy = { [query.sortBy]: order };
      }
    }

    const [total, users] = await userRepository.findAll({
      skip,
      take: limit,
      where,
      orderBy,
    });

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getUserById(id) {
    const user = await userRepository.findByIdWithRentals(id);
    if (!user) throw new ApiError(404, 'User not found');
    return user;
  }

  async deleteUser(id) {
    const user = await userRepository.findById(id);
    if (!user) throw new ApiError(404, 'User not found');
    if (user.role === 'ADMIN') {
      throw new ApiError(400, 'Admin accounts cannot be deleted from this endpoint');
    }
    await userRepository.delete(id);
    return true;
  }
}

export default new UserService();
