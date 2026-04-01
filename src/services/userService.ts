import { Prisma, User } from '@prisma/client';
import prisma from '../prisma/client';
import { NotFoundError } from '../utils/errors';
import { UpdateUserInput } from '../validators/userValidator';

export interface ManagedUser {
  id: number;
  email: string;
  role: User['role'];
  isActive: boolean;
  createdAt: Date;
  recordCount?: number;
}

function mapUser(user: User & { _count?: { financialRecords: number } }): ManagedUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    recordCount: user._count?.financialRecords,
  };
}

async function listUsers(): Promise<ManagedUser[]> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          financialRecords: true,
        },
      },
    },
  });

  return users.map(mapUser);
}

async function getUserById(id: number): Promise<ManagedUser> {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          financialRecords: true,
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return mapUser(user);
}

async function updateUser(id: number, payload: UpdateUserInput): Promise<ManagedUser> {
  const existingUser = await prisma.user.findUnique({ where: { id } });

  if (!existingUser) {
    throw new NotFoundError('User not found');
  }

  const data: Prisma.UserUpdateInput = {};

  if (payload.role !== undefined) {
    data.role = payload.role;
  }

  if (payload.isActive !== undefined) {
    data.isActive = payload.isActive;
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data,
    include: {
      _count: {
        select: {
          financialRecords: true,
        },
      },
    },
  });

  return mapUser(updatedUser);
}

export const userService = {
  listUsers,
  getUserById,
  updateUser,
};
