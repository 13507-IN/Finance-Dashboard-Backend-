import { z } from 'zod';

const recordTypeSchema = z.enum(['INCOME', 'EXPENSE']);

export const categoryQuerySchema = z.object({
  type: recordTypeSchema.optional(),
});

export const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  type: recordTypeSchema,
});

export type CategoryQueryInput = z.infer<typeof categoryQuerySchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
