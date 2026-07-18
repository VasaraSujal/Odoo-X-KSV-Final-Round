import prisma from '../../config/db.js';

const USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  profileImage: true,
  role: true,
  accountStatus: true,
  isVerified: true,
  dateOfBirth: true,
  gender: true,
  drivingLicenseNo: true,
  drivingLicenseImage: true,
  createdAt: true,
  updatedAt: true,
};

class UserRepository {
  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });
  }

  async findByIdWithRentals(id) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        ...USER_SELECT,
        rentalOrders: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            orderNumber: true,
            orderStatus: true,
            rentalAmount: true,
            pickupDate: true,
            expectedReturnDate: true,
            createdAt: true,
          },
        },
        _count: {
          select: { rentalOrders: true },
        },
      },
    });
  }

  async findAll({ skip, take, where = {}, orderBy = { createdAt: 'desc' } } = {}) {
    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy,
        select: USER_SELECT,
      }),
    ]);
    return [total, users];
  }

  async update(id, data) {
    const {
      firstName,
      lastName,
      phone,
      profileImage,
      dateOfBirth,
      gender,
      drivingLicenseNo,
      drivingLicenseImage,
      accountStatus,
      isVerified,
    } = data;

    return prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        phone,
        profileImage,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        drivingLicenseNo,
        drivingLicenseImage,
        accountStatus,
        isVerified,
      },
      select: USER_SELECT,
    });
  }

  async delete(id) {
    return prisma.user.delete({ where: { id } });
  }
}

export default new UserRepository();
