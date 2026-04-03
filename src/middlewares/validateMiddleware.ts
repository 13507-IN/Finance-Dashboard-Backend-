import { NextFunction, Request, Response } from 'express';
import { ZodTypeAny } from 'zod';
import { RequestWithValidatedQuery } from '../types/request';

export function validateBody(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    req.body = schema.parse(req.body);
    next();
  };
}

export function validateQuery(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    (req as RequestWithValidatedQuery).validatedQuery = schema.parse(req.query);
    next();
  };
}

export function validateParams(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    req.params = schema.parse(req.params);
    next();
  };
}
