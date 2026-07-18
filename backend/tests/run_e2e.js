import fs from 'fs';

const BASE_URL = 'http://localhost:5000/api';
let adminToken = '';
let customerToken = '';
let categoryId = '';
let vehicleId = '';
let customerId = '';
let orderId = '';
let pickupOtp = '';

async function runTest(name, method, endpoint, body, token) {
  console.log('[TEST] ' + name + ' - ' + method + ' ' + endpoint);
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  
  try {
    const res = await fetch(BASE_URL + endpoint, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('FAILED: ' + name, data);
      return { success: false, data };
    }
    console.log('PASSED: ' + name);
    return { success: true, data };
  } catch (error) {
    console.error('ERROR: ' + name, error.message);
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  console.log('--- STARTING E2E RESTRUCTURED API TESTS ---\n');

  // 1. Auth Admin
  const adminLogin = await runTest('Admin Login', 'POST', '/auth/login', { email: 'admin@driveease.com', password: 'Admin@123' });
  if (adminLogin.success) adminToken = adminLogin.data.data.token;

  // 2. Auth Customer (Register & Login)
  const randEmail = `testuser_${Date.now()}@test.com`;
  await runTest('Register Customer', 'POST', '/auth/register', { firstName: 'Test', lastName: 'User', email: randEmail, password: 'Password@123', role: 'CUSTOMER' });
  const custLogin = await runTest('Customer Login', 'POST', '/auth/login', { email: randEmail, password: 'Password@123' });
  if (custLogin.success) {
    customerToken = custLogin.data.data.token;
    customerId = custLogin.data.data.user.id;
  }

  // 3. Categories
  const cat = await runTest('Create Category', 'POST', '/categories', { categoryName: 'SUV_' + Date.now(), vehicleType: 'Four_Wheeler', description: 'Sport Utility Vehicle' }, adminToken);
  if (cat.success) categoryId = cat.data.data.id;

  // 4. Vehicles
  const regNumber = 'KA05-' + Math.floor(1000 + Math.random() * 9000);
  const veh = await runTest('Create Vehicle', 'POST', '/vehicles', {
    categoryId,
    vehicleName: 'Toyota Fortuner E2E',
    brand: 'Toyota',
    model: 'Fortuner',
    registrationNumber: regNumber,
    year: 2023,
    fuelType: 'Diesel',
    transmission: 'Automatic',
    color: 'White',
    seatCapacity: 7,
    mileage: 12.5,
    rentPerHour: 200,
    rentPerDay: 3000,
    rentPerWeek: 18000,
    rentPerMonth: 65000,
    securityDeposit: 15000,
    engineCapacity: '2755 cc',
    currentOdometer: 10000
  }, adminToken);
  if (veh.success) vehicleId = veh.data.data.id;

  // 5. Rental Orders (Customer creates)
  const pickupDate = new Date(Date.now() + 86400000).toISOString();
  const returnDate = new Date(Date.now() + 86400000 * 4).toISOString();
  const order = await runTest('Create Rental Order', 'POST', '/rental-orders', {
    vehicleId,
    pickupType: 'Store_Pickup',
    pickupDate,
    expectedReturnDate: returnDate,
    rentalUnit: 'Day',
    rentalDuration: 3
  }, customerToken);
  if (order.success) {
    orderId = order.data.data.id;
    pickupOtp = order.data.data.pickupOtp;
  }

  // 6. Confirm Order
  if (orderId) {
    await runTest('Confirm Order', 'PATCH', '/rental-orders/' + orderId + '/status', { status: 'Confirmed' }, adminToken);
  }

  // 7. Process Pickup (Otp check)
  if (orderId && pickupOtp) {
    await runTest('Process Pickup', 'PATCH', '/rental-orders/' + orderId + '/pickup', { pickupOtp }, adminToken);
  }

  // 8. Process Return & Inspection (Trigger Invoice)
  if (orderId) {
    await runTest('Process Return & Inspection', 'PATCH', '/rental-orders/' + orderId + '/return', {
      returnCondition: 'Good',
      returnRemarks: 'Returned safely, no damage.',
      penaltyAmount: 0
    }, adminToken);
  }

  // 9. Dashboards & Reports
  await runTest('Dashboard Overview', 'GET', '/dashboard/overview', null, adminToken);
  await runTest('Reports Rentals', 'GET', '/reports/rentals', null, adminToken);

  console.log('\n--- E2E TESTS COMPLETED ---');
}

runAllTests();
