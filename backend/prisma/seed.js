import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding restructured ERP database...');

  // 1. Admin User
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@driveease.com' },
    update: {},
    create: {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@driveease.com',
      password: adminPassword,
      role: 'ADMIN',
      accountStatus: 'Active',
      isVerified: true,
    },
  });
  console.log('Admin user seeded:', admin.email);

  // 2. Customer User
  const customerPassword = await bcrypt.hash('Customer@123', 10);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@driveease.com' },
    update: {},
    create: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'customer@driveease.com',
      password: customerPassword,
      role: 'CUSTOMER',
      accountStatus: 'Active',
      phone: '+91 9999999999',
      isVerified: true,
      gender: 'Male',
      dateOfBirth: new Date('1995-05-15'),
      drivingLicenseNo: 'DL-GJ012023000987',
      drivingLicenseImage: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500',
    },
  });
  console.log('Customer user seeded:', customer.email);

  // 3. Customer Address
  let address = await prisma.userAddresses.findFirst({
    where: { userId: customer.id }
  });
  if (!address) {
    address = await prisma.userAddresses.create({
      data: {
        userId: customer.id,
        addressType: 'Home',
        addressLine: '404 Tech Park, SG Highway',
        city: 'Ahmedabad',
        state: 'Gujarat',
        country: 'India',
        pincode: '380054',
        isDefault: true,
      }
    });
    console.log('Customer address seeded');
  }

  // 4. Categories
  const categoriesData = [
    { name: 'SUV', type: 'Four_Wheeler' },
    { name: 'Sedan', type: 'Four_Wheeler' },
    { name: 'Hatchback', type: 'Four_Wheeler' },
    { name: 'Luxury', type: 'Four_Wheeler' },
    { name: 'Electric', type: 'Four_Wheeler' },
    { name: 'Convertible', type: 'Four_Wheeler' }
  ];
  const categories = {};
  for (const cat of categoriesData) {
    const dbCat = await prisma.category.upsert({
      where: { categoryName: cat.name },
      update: {},
      create: { 
        categoryName: cat.name,
        vehicleType: cat.type,
        description: `${cat.name} rental vehicles`,
        status: true
      },
    });
    categories[cat.name] = dbCat.id;
  }
  console.log('Categories seeded');

  // 5. Vehicles
  const vehiclesData = [
    { brand: 'Toyota', model: 'Fortuner', cat: 'SUV', reg: 'GJ01AB1234', vin: 'VIN1234567890SUV1', year: 2023, fuel: 'Diesel', trans: 'Automatic', seats: 7, mileage: 12, hrPrice: 200, dayPrice: 3000, wkPrice: 18000, moPrice: 65000, dep: 10000, color: 'White' },
    { brand: 'Hyundai', model: 'Creta', cat: 'SUV', reg: 'GJ01CD5678', vin: 'VIN1234567890SUV2', year: 2022, fuel: 'Petrol', trans: 'Manual', seats: 5, mileage: 14, hrPrice: 150, dayPrice: 2000, wkPrice: 12000, moPrice: 45000, dep: 5000, color: 'Black' },
    { brand: 'Honda', model: 'City', cat: 'Sedan', reg: 'GJ01EF9012', vin: 'VIN1234567890SED1', year: 2023, fuel: 'Petrol', trans: 'Automatic', seats: 5, mileage: 16, hrPrice: 120, dayPrice: 1800, wkPrice: 10500, moPrice: 38000, dep: 5000, color: 'Silver' },
    { brand: 'Maruti', model: 'Baleno', cat: 'Hatchback', reg: 'GJ01GH3456', vin: 'VIN1234567890HAT1', year: 2021, fuel: 'Petrol', trans: 'Manual', seats: 5, mileage: 18, hrPrice: 90, dayPrice: 1200, wkPrice: 7200, moPrice: 26000, dep: 3000, color: 'Blue' },
    { brand: 'BMW', model: 'X5', cat: 'Luxury', reg: 'GJ01IJ7890', vin: 'VIN1234567890LUX1', year: 2023, fuel: 'Petrol', trans: 'Automatic', seats: 5, mileage: 10, hrPrice: 500, dayPrice: 8000, wkPrice: 48000, moPrice: 180000, dep: 20000, color: 'Black' },
    { brand: 'Mercedes', model: 'C-Class', cat: 'Luxury', reg: 'GJ01KL1234', vin: 'VIN1234567890LUX2', year: 2022, fuel: 'Diesel', trans: 'Automatic', seats: 5, mileage: 12, hrPrice: 450, dayPrice: 7500, wkPrice: 45000, moPrice: 160000, dep: 15000, color: 'White' },
    { brand: 'Tata', model: 'Nexon EV', cat: 'Electric', reg: 'GJ01MN5678', vin: 'VIN1234567890ELE1', year: 2023, fuel: 'Electric', trans: 'Automatic', seats: 5, mileage: 300, hrPrice: 180, dayPrice: 2500, wkPrice: 15000, moPrice: 55000, dep: 8000, color: 'Teal' },
    { brand: 'Mahindra', model: 'Scorpio N', cat: 'SUV', reg: 'GJ01OP9012', vin: 'VIN1234567890SUV3', year: 2023, fuel: 'Diesel', trans: 'Manual', seats: 7, mileage: 11, hrPrice: 180, dayPrice: 2500, wkPrice: 15000, moPrice: 55000, dep: 8000, color: 'Green' },
  ];

  const vehicles = {};
  for (const v of vehiclesData) {
    const dbVehicle = await prisma.vehicle.upsert({
      where: { registrationNumber: v.reg },
      update: {},
      create: {
        categoryId: categories[v.cat],
        vehicleName: `${v.brand} ${v.model}`,
        brand: v.brand,
        model: v.model,
        registrationNumber: v.reg,
        color: v.color,
        year: v.year,
        fuelType: v.fuel,
        transmission: v.trans,
        seatCapacity: v.seats,
        mileage: v.mileage,
        rentPerHour: v.hrPrice,
        rentPerDay: v.dayPrice,
        rentPerWeek: v.wkPrice,
        rentPerMonth: v.moPrice,
        securityDeposit: v.dep,
        status: 'Available',
        currentOdometer: 10000,
        averageRating: 4.5,
        totalRentals: 0,
      }
    });
    vehicles[v.reg] = dbVehicle;

    // Seed primary image
    await prisma.vehicleImage.create({
      data: {
        vehicleId: dbVehicle.id,
        imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=500',
        isPrimary: true,
        displayOrder: 1
      }
    });
  }
  console.log('Vehicles and Images seeded');

  // 6. Rental Orders (Orders in PENDING, ACTIVE, COMPLETED, CANCELLED states)
  let order1 = await prisma.rentalOrder.findFirst({ where: { orderNumber: 'BK-1001' } });
  if (!order1) {
    // Order 1: Completed rental
    const pickupDate1 = new Date();
    pickupDate1.setDate(pickupDate1.getDate() - 10);
    const returnDate1 = new Date();
    returnDate1.setDate(returnDate1.getDate() - 7);

    order1 = await prisma.rentalOrder.create({
      data: {
        orderNumber: 'BK-1001',
        customerId: customer.id,
        vehicleId: vehicles['GJ01AB1234'].id,
        pickupType: 'Store_Pickup',
        pickupDate: pickupDate1,
        expectedReturnDate: returnDate1,
        actualReturnDate: returnDate1,
        rentalUnit: 'Day',
        rentalDuration: 3,
        rentalAmount: 9000,
        pickupStatus: true,
        pickupOtp: '1234',
        returnCondition: 'Good',
        returnRemarks: 'Clean vehicle returned on time.',
        orderStatus: 'Completed',
        remarks: 'Excellent rental service. Completed without delay.',
      }
    });

    // Add Payment record
    const payment1 = await prisma.payment.create({
      data: {
        orderId: order1.id,
        customerId: customer.id,
        rentalAmount: 9000,
        taxAmount: 1620, // 18% tax
        totalAmount: 10620,
        paymentMethod: 'UPI',
        transactionId: 'TXN-ABC-001',
        paymentStatus: 'Paid',
        paymentDate: new Date(pickupDate1),
      }
    });

    // Add Security Deposit record
    const deposit1 = await prisma.securityDeposit.create({
      data: {
        orderId: order1.id,
        customerId: customer.id,
        depositAmount: 10000,
        penaltyAmount: 0,
        refundAmount: 10000,
        refundMethod: 'UPI',
        refundStatus: 'Refunded',
        depositStatus: 'Released',
        refundDate: new Date(),
        remarks: 'Refunded full amount. No vehicle damage.',
      }
    });

    // Add Invoice record
    await prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-1001',
        orderId: order1.id,
        customerId: customer.id,
        paymentId: payment1.id,
        rentalAmount: 9000,
        taxAmount: 1620,
        depositAmount: 10000,
        penaltyAmount: 0,
        totalAmount: 10620,
        invoiceStatus: 'Paid',
      }
    });
  }

  let order2 = await prisma.rentalOrder.findFirst({ where: { orderNumber: 'BK-1002' } });
  if (!order2) {
    // Order 2: Active rental (currently driving)
    const pickupDate2 = new Date();
    pickupDate2.setDate(pickupDate2.getDate() - 1);
    const returnDate2 = new Date();
    returnDate2.setDate(returnDate2.getDate() + 2);

    order2 = await prisma.rentalOrder.create({
      data: {
        orderNumber: 'BK-1002',
        customerId: customer.id,
        vehicleId: vehicles['GJ01CD5678'].id,
        pickupType: 'Home_Delivery',
        deliveryAddressId: address.id,
        pickupDate: pickupDate2,
        expectedReturnDate: returnDate2,
        rentalUnit: 'Day',
        rentalDuration: 3,
        rentalAmount: 6000,
        pickupStatus: true,
        pickupOtp: '5678',
        orderStatus: 'Active',
        remarks: 'Vehicle is currently in use.',
      }
    });

    // Add Payment
    await prisma.payment.create({
      data: {
        orderId: order2.id,
        customerId: customer.id,
        rentalAmount: 6000,
        taxAmount: 1080,
        totalAmount: 7080,
        paymentMethod: 'Card',
        transactionId: 'TXN-ABC-002',
        paymentStatus: 'Paid',
        paymentDate: new Date(pickupDate2),
      }
    });

    // Add Security Deposit
    await prisma.securityDeposit.create({
      data: {
        orderId: order2.id,
        customerId: customer.id,
        depositAmount: 5000,
        refundStatus: 'Pending',
        depositStatus: 'Held',
        remarks: 'Held until return.',
      }
    });

    // Set Vehicle availability to Rented
    await prisma.vehicle.update({
      where: { id: vehicles['GJ01CD5678'].id },
      data: { status: 'Rented' }
    });
  }

  let order3 = await prisma.rentalOrder.findFirst({ where: { orderNumber: 'BK-1003' } });
  if (!order3) {
    // Order 3: Pending Approval
    const pickupDate3 = new Date();
    pickupDate3.setDate(pickupDate3.getDate() + 3);
    const returnDate3 = new Date();
    returnDate3.setDate(returnDate3.getDate() + 4);

    order3 = await prisma.rentalOrder.create({
      data: {
        orderNumber: 'BK-1003',
        customerId: customer.id,
        vehicleId: vehicles['GJ01EF9012'].id,
        pickupType: 'Store_Pickup',
        pickupDate: pickupDate3,
        expectedReturnDate: returnDate3,
        rentalUnit: 'Day',
        rentalDuration: 1,
        rentalAmount: 1800,
        orderStatus: 'Pending',
      }
    });
  }

  let order4 = await prisma.rentalOrder.findFirst({ where: { orderNumber: 'BK-1004' } });
  if (!order4) {
    // Order 4: Completed with Late Return penalty
    const pickupDate4 = new Date();
    pickupDate4.setDate(pickupDate4.getDate() - 5);
    const expectedReturn4 = new Date();
    expectedReturn4.setDate(expectedReturn4.getDate() - 4);
    const actualReturn4 = new Date();
    actualReturn4.setDate(actualReturn4.getDate() - 3); // 24 Hours late

    order4 = await prisma.rentalOrder.create({
      data: {
        orderNumber: 'BK-1004',
        customerId: customer.id,
        vehicleId: vehicles['GJ01GH3456'].id,
        pickupType: 'Store_Pickup',
        pickupDate: pickupDate4,
        expectedReturnDate: expectedReturn4,
        actualReturnDate: actualReturn4,
        rentalUnit: 'Day',
        rentalDuration: 1,
        rentalAmount: 1200,
        pickupStatus: true,
        pickupOtp: '9988',
        returnCondition: 'Damaged',
        returnRemarks: 'Returned one day late. Minor cosmetic scratch on bumper.',
        orderStatus: 'Completed',
      }
    });

    // Add Payments
    const payment4 = await prisma.payment.create({
      data: {
        orderId: order4.id,
        customerId: customer.id,
        rentalAmount: 1200,
        taxAmount: 216,
        totalAmount: 1416, // Initial amount (subtotal + tax)
        paymentMethod: 'UPI',
        transactionId: 'TXN-ABC-004A',
        paymentStatus: 'Paid',
        paymentDate: new Date(pickupDate4),
      }
    });

    // Add Security Deposit with Penalty
    await prisma.securityDeposit.create({
      data: {
        orderId: order4.id,
        customerId: customer.id,
        depositAmount: 3000,
        penaltyAmount: 1000, // Late fee penalty
        penaltyReason: 'Returned 24 hours late.',
        refundAmount: 2000,
        refundMethod: 'UPI',
        refundStatus: 'Refunded',
        depositStatus: 'Released',
        refundDate: new Date(),
        remarks: 'Deducted late fee penalty from security deposit.',
      }
    });

    // Add Invoice
    await prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-1004',
        orderId: order4.id,
        customerId: customer.id,
        paymentId: payment4.id,
        rentalAmount: 1200,
        taxAmount: 216,
        depositAmount: 3000,
        penaltyAmount: 1000,
        totalAmount: 2416,
        invoiceStatus: 'Paid',
      }
    });
  }
  console.log('Restructured Rental Orders and financial sub-tables seeded successfully.');

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
