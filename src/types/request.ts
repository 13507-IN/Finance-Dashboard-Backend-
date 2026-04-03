import { Request } from 'express';

export type RequestWithValidatedQuery<T = unknown> = Request & {
  validatedQuery?: T;
};
