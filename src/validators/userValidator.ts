import { z } from 'zod';

export const userIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const updateUserSchema = z
  .object({
    role: z.enum(['VIEWER', 'ANALYST', 'ADMIN']).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, 'At least one field is required to update user');

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
