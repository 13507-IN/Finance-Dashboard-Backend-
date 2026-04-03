import { z } from 'zod';

const recordTypeSchema = z.enum(['INCOME', 'EXPENSE']);

export const financialRecordIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createFinancialRecordSchema = z.object({
  amount: z.coerce.number().positive('Amount must be a positive value'),
  type: recordTypeSchema,
  category: z.string().trim().min(2).max(80),
  date: z.coerce.date({
    invalid_type_error: 'Date must be valid',
  }),
  notes: z.string().trim().max(500).optional(),
  userId: z.coerce.number().int().positive().optional(),
});

export const updateFinancialRecordSchema =
  createFinancialRecordSchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, 'At least one field is required to update');

export const financialRecordFilterSchema = z
  .object({
    type: recordTypeSchema.optional(),
    category: z.string().trim().min(1).max(80).optional(),
    search: z.string().trim().min(1).max(80).optional(),
    userId: z.coerce.number().int().positive().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z.enum(['date', 'amount', 'createdAt']).default('date'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  })
  .refine(
    (data) => !(data.startDate && data.endDate) || data.endDate >= data.startDate,
    'endDate must be greater than or equal to startDate',
  );

export type CreateFinancialRecordInput = z.infer<typeof createFinancialRecordSchema>;
export type UpdateFinancialRecordInput = z.infer<typeof updateFinancialRecordSchema>;
export type FinancialRecordFilterInput = z.infer<typeof financialRecordFilterSchema>;
