import bcrypt from 'bcryptjs';
import { Role, User } from '@prisma/client';
import { config } from '../config/env';
import prisma from '../prisma/client';
import { ConflictError, UnauthorizedError } from '../utils/errors';
import { signAccessToken } from '../utils/jwt';
import { LoginInput, RegisterInput } from '../validators/authValidator';

export interface AuthResponse {
  token: string;
  user: PublicUser;
}

export interface PublicUser {
  id: number;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
}

function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

async function register(payload: RegisterInput): Promise<AuthResponse> {
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existingUser) {
    throw new ConflictError('Email is already in use');
  }

  const hashedPassword = await bcrypt.hash(payload.password, config.bcryptSaltRounds);

  const user = await prisma.user.create({
    data: {
      email: payload.email,
      password: hashedPassword,
      role: payload.role ?? Role.VIEWER,
    },
  });

  const token = signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    token,
    user: toPublicUser(user),
  };
}

async function login(payload: LoginInput): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (!user.isActive) {
    throw new UnauthorizedError('Your account is inactive. Contact administrator');
  }

  const passwordMatched = await bcrypt.compare(payload.password, user.password);

  if (!passwordMatched) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const token = signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    token,
    user: toPublicUser(user),
  };
}

async function getProfile(userId: number): Promise<PublicUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  return toPublicUser(user);
}

export const authService = {
  register,
  login,
  getProfile,
};
