import { Request, Response } from 'express';
import { healthService } from '../services/healthService';

export async function healthCheck(_req: Request, res: Response): Promise<void> {
  const health = await healthService.getHealthStatus();
  res.status(200).json({
    success: true,
    message: 'Service health status',
    data: health,
  });
}
