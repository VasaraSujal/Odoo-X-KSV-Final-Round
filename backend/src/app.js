import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { errorHandler } from '../middlewares/error.middleware.js';
import { notFound } from '../middlewares/notFound.middleware.js';

// Module Imports
import authRoute from '../modules/auth/index.js';
import usersRoute from '../modules/users/index.js';
import categoriesRoute from '../modules/categories/index.js';
import rentalPeriodsRoute from '../modules/rentalPeriods/index.js';
import vehiclesRoute from '../modules/vehicles/index.js';
import vehicleImagesRoute from '../modules/vehicleImages/index.js';
import priceListsRoute from '../modules/priceLists/index.js';
import rentalOrdersRoute from '../modules/rentalOrders/index.js';
import rentalItemsRoute from '../modules/rentalItems/index.js';
import quotationsRoute from '../modules/quotations/index.js';
import paymentsRoute from '../modules/payments/index.js';
import securityDepositsRoute from '../modules/securityDeposits/index.js';
import pickupsRoute from '../modules/pickups/index.js';
import returnsRoute from '../modules/returns/index.js';
import penaltiesRoute from '../modules/penalties/index.js';
import dashboardRoute from '../modules/dashboard/index.js';
import reportsRoute from '../modules/reports/index.js';
import analyticsRoute from '../modules/analytics/index.js';
import settingsRoute from '../modules/settings/index.js';
import stripeRoute from '../modules/stripe/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Production Hardening: Stripe Webhook requires raw body parsing before express.json()
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use((req, res, next) => {
  if (req.originalUrl === '/api/stripe/webhook') {
    req.rawBody = req.body;
  }
  next();
});

// Production Hardening Middleware
app.use(helmet());
app.use(compression());
app.use(cors({ origin: '*', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10kb' })); // Request size limits
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Swagger Documentation Setup
const swaggerDocument = JSON.parse(fs.readFileSync(path.join(__dirname, '../swagger.json'), 'utf8'));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is healthy', timestamp: new Date() });
});

// API Routes
app.use('/api/auth', authRoute);
app.use('/api/users', usersRoute);
app.use('/api/categories', categoriesRoute);
app.use('/api/rental-periods', rentalPeriodsRoute);
app.use('/api/vehicles', vehiclesRoute);
app.use('/api', vehicleImagesRoute); 
app.use('/api/price-lists', priceListsRoute);
app.use('/api/rental-orders', rentalOrdersRoute);
app.use('/api', rentalItemsRoute);
app.use('/api', quotationsRoute);
app.use('/api/payments', paymentsRoute);
app.use('/api/security-deposits', securityDepositsRoute);
app.use('/api/pickups', pickupsRoute);
app.use('/api/returns', returnsRoute);
app.use('/api/penalties', penaltiesRoute);
app.use('/api/dashboard', dashboardRoute);
app.use('/api/reports', reportsRoute);
app.use('/api/analytics', analyticsRoute);
app.use('/api/settings', settingsRoute);
app.use('/api/stripe', stripeRoute);

// Error Handling
app.use(notFound);
app.use(errorHandler);

export default app;
