import jwt, { SignOptions } from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { config } from '../config/env';
import { UnauthorizedError } from './errors';

export interface AuthTokenPayload {
  userId: number;
  email: string;
  role: Role;
}

const signOptions: SignOptions = {
  expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'],
};

export function signAccessToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, config.jwtSecret, signOptions);
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  try {
    return jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}
