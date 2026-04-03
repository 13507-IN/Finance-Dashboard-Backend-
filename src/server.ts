import app from './app';
import { config } from './config/env';
import prisma from './prisma/client';
import { categoryService } from './services/categoryService';
import { logger } from './utils/logger';

let server: ReturnType<typeof app.listen> | undefined;

async function startServer(): Promise<void> {
  await categoryService.ensureSystemCategories();
  logger.info('System categories are ready');

  server = app.listen(config.port, () => {
    logger.info(`Server started on http://localhost:${config.port}`);
    logger.info(`Environment: ${config.nodeEnv}`);
  });
}

async function gracefulShutdown(signal: string): Promise<void> {
  logger.warn(`${signal} received. Shutting down gracefully.`);

  if (!server) {
    await prisma.$disconnect();
    process.exit(0);
    return;
  }

  server.close(async () => {
    await prisma.$disconnect();
    logger.info('HTTP server and database connections closed.');
    process.exit(0);
  });
}

process.on('SIGINT', async () => {
  await gracefulShutdown('SIGINT');
});

process.on('SIGTERM', async () => {
  await gracefulShutdown('SIGTERM');
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', reason);
  process.exit(1);
});

void startServer().catch(async (error) => {
  logger.error('Failed to start server', error);
  await prisma.$disconnect();
  process.exit(1);
});

export default server;
