import prisma from '../../config/db.js';

class AuthRepository {
  async createUser(data) {
    return prisma.user.create({ data });
  }

  async findUserByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  }

  async findUserById(id) {
    return prisma.user.findUnique({ where: { id } });
  }

  async updatePassword(id, hashedPassword) {
    return prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }
}

export default new AuthRepository();
