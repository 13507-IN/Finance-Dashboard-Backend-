import { z } from 'zod';

export const dashboardQuerySchema = z
  .object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  })
  .refine(
    (data) => !(data.startDate && data.endDate) || data.endDate >= data.startDate,
    'endDate must be greater than or equal to startDate',
  );

export type DashboardQueryInput = z.infer<typeof dashboardQuerySchema>;
