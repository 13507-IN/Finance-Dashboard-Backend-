import prisma from '../prisma/client';

async function getHealthStatus(): Promise<{ status: string; database: string; timestamp: string }> {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return {
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    };
  } catch {
    return {
      status: 'degraded',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    };
  }
}

export const healthService = {
  getHealthStatus,
};
