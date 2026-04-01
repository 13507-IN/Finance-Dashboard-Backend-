import { Role } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { RequestWithUser } from '../types/auth';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

export function authorize(...allowedRoles: Role[]) {
  // Central RBAC gate: each route explicitly declares which roles can access it.
  return (req: Request, _res: Response, next: NextFunction): void => {
    const request = req as RequestWithUser;

    if (!request.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (!allowedRoles.includes(request.user.role)) {
      next(new ForbiddenError('You are not allowed to access this resource'));
      return;
    }

    next();
  };
}
