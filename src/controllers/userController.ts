import { Request, Response } from 'express';
import { userService } from '../services/userService';
import { sendSuccess } from '../utils/response';

export async function listUsers(_req: Request, res: Response): Promise<void> {
  const users = await userService.listUsers();
  sendSuccess(res, 200, 'Users fetched successfully', users);
}

export async function getUserById(req: Request, res: Response): Promise<void> {
  const user = await userService.getUserById(Number(req.params.id));
  sendSuccess(res, 200, 'User fetched successfully', user);
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  const user = await userService.updateUser(Number(req.params.id), req.body);
  sendSuccess(res, 200, 'User updated successfully', user);
}
