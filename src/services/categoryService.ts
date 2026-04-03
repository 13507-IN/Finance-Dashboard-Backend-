import { Category, RecordType } from '@prisma/client';
import prisma from '../prisma/client';
import { AuthenticatedUser } from '../types/auth';
import { ConflictError } from '../utils/errors';
import { CategoryQueryInput, CreateCategoryInput } from '../validators/categoryValidator';

interface CategoryResponse {
  id: number;
  name: string;
  type: RecordType;
  isSystem: boolean;
  createdById: number | null;
  createdAt: Date;
}

const SYSTEM_CATEGORIES: Array<{ name: string; type: RecordType }> = [
  { name: 'Salary', type: 'INCOME' },
  { name: 'Freelance', type: 'INCOME' },
  { name: 'Investments', type: 'INCOME' },
  { name: 'Business', type: 'INCOME' },
  { name: 'Other Income', type: 'INCOME' },
  { name: 'Rent', type: 'EXPENSE' },
  { name: 'Food', type: 'EXPENSE' },
  { name: 'Utilities', type: 'EXPENSE' },
  { name: 'Transport', type: 'EXPENSE' },
  { name: 'Health', type: 'EXPENSE' },
  { name: 'Entertainment', type: 'EXPENSE' },
  { name: 'Other Expense', type: 'EXPENSE' },
];

function normalizeCategoryName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function mapCategory(category: Category): CategoryResponse {
  return {
    id: category.id,
    name: category.name,
    type: category.type,
    isSystem: category.isSystem,
    createdById: category.createdById,
    createdAt: category.createdAt,
  };
}

async function ensureSystemCategories(): Promise<void> {
  await Promise.all(
    SYSTEM_CATEGORIES.map((category) =>
      prisma.category.upsert({
        where: {
          normalizedName_type: {
            normalizedName: normalizeCategoryName(category.name),
            type: category.type,
          },
        },
        update: {
          name: category.name,
          isSystem: true,
        },
        create: {
          name: category.name,
          normalizedName: normalizeCategoryName(category.name),
          type: category.type,
          isSystem: true,
        },
      }),
    ),
  );
}

async function listCategories(filters: CategoryQueryInput): Promise<CategoryResponse[]> {
  const categories = await prisma.category.findMany({
    where: {
      ...(filters.type ? { type: filters.type } : {}),
    },
    orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
  });

  return categories.map(mapCategory);
}

async function createCategory(payload: CreateCategoryInput, actor: AuthenticatedUser): Promise<CategoryResponse> {
  const normalizedName = normalizeCategoryName(payload.name);

  const existing = await prisma.category.findUnique({
    where: {
      normalizedName_type: {
        normalizedName,
        type: payload.type,
      },
    },
  });

  if (existing) {
    throw new ConflictError(`Category '${payload.name}' already exists for ${payload.type}`);
  }

  const category = await prisma.category.create({
    data: {
      name: payload.name.trim().replace(/\s+/g, ' '),
      normalizedName,
      type: payload.type,
      isSystem: false,
      createdById: actor.id,
    },
  });

  return mapCategory(category);
}

async function categoryExists(name: string, type: RecordType): Promise<boolean> {
  const normalizedName = normalizeCategoryName(name);

  const category = await prisma.category.findUnique({
    where: {
      normalizedName_type: {
        normalizedName,
        type,
      },
    },
    select: { id: true },
  });

  return Boolean(category);
}

export const categoryService = {
  ensureSystemCategories,
  listCategories,
  createCategory,
  categoryExists,
};
