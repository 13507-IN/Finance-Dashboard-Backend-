import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboardService';
import { sendSuccess } from '../utils/response';
import { DashboardQueryInput } from '../validators/dashboardValidator';

export async function getDashboardAnalytics(req: Request, res: Response): Promise<void> {
  const analytics = await dashboardService.getAnalytics(req.query as unknown as DashboardQueryInput);
  sendSuccess(res, 200, 'Dashboard analytics fetched successfully', analytics);
}
