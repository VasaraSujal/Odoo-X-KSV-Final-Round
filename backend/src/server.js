// Handle Uncaught Exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Always load backend/.env and override any shell/local defaults
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

import app from './app.js';
import prisma from '../config/db.js';

const PORT = process.env.PORT || 5000;

let server;

const startServer = async () => {
  const maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await prisma.$connect();
      console.log('Database connected successfully');
      break;
    } catch (error) {
      const isLast = attempt === maxAttempts;
      console.error(
        `Database connect attempt ${attempt}/${maxAttempts} failed:`,
        error.message
      );
      if (isLast) {
        console.error(
          'Failed to start server: cannot reach Neon. Open the Neon console to wake the project, check the connection string, then retry.'
        );
        process.exit(1);
      }
      // Neon idle compute often needs a few seconds to wake
      await new Promise((resolve) => setTimeout(resolve, 3000 * attempt));
    }
  }

  try {
    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Handle Unhandled Rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  if (server) {
    server.close(() => {
      console.log('💥 Process terminated!');
    });
  }
});
