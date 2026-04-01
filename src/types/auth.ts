import { Role } from '@prisma/client';
import { Request } from 'express';

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: Role;
  isActive: boolean;
}

export type RequestWithUser = Request & {
  user?: AuthenticatedUser;
};

export type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};
