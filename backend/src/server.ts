import 'dotenv/config';
import app from './app';
import { config } from './config/env';
import { logger } from './config/logger';
import prisma from './config/database';
import { startAllJobs, stopAllJobs } from './jobs/scheduler';

const startServer = async (): Promise<void> => {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('✅ Database connected successfully');

    const server = app.listen(config.PORT, () => {
      logger.info(`🚀 FinTrack API running on port ${config.PORT}`);
      logger.info(`📍 Environment: ${config.NODE_ENV}`);
    });

    // Start background jobs
    if (config.NODE_ENV !== 'test') {
      startAllJobs();
    }

    // Graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        if (config.NODE_ENV !== 'test') {
          stopAllJobs();
        }

        await prisma.$disconnect();
        logger.info('Database disconnected');

        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection:', reason);
      process.exit(1);
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

startServer();
