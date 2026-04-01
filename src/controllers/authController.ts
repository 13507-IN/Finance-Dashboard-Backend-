import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { AuthenticatedRequest } from '../types/auth';
import { sendSuccess } from '../utils/response';

export async function register(req: Request, res: Response): Promise<void> {
  const result = await authService.register(req.body);
  sendSuccess(res, 201, 'User registered successfully', result);
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = await authService.login(req.body);
  sendSuccess(res, 200, 'Login successful', result);
}

export async function getMe(req: Request, res: Response): Promise<void> {
  const profile = await authService.getProfile((req as AuthenticatedRequest).user.id);
  sendSuccess(res, 200, 'Profile fetched successfully', profile);
}
