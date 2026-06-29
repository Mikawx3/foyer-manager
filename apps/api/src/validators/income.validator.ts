import { z } from "zod";

export const monthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must be in YYYY-MM format");

export const incomeHouseholdParamSchema = z.object({
  id: z.string().cuid(),
});

export const incomeParamsSchema = z.object({
  id: z.string().cuid(),
  incomeId: z.string().cuid(),
});

export const listIncomesQuerySchema = z.object({
  month: monthSchema,
});

export const incomeStatsQuerySchema = z.object({
  month: monthSchema,
});

export const createIncomeSchema = z.object({
  tenantId: z.string().cuid(),
  amount: z.number().positive().max(999_999_999.99),
  label: z.string().trim().min(1).max(100),
  month: monthSchema,
  note: z.string().trim().max(500).optional(),
  householdId: z.string().cuid(),
});

export const updateIncomeSchema = z
  .object({
    amount: z.number().positive().max(999_999_999.99).optional(),
    label: z.string().trim().min(1).max(100).optional(),
    note: z.string().trim().max(500).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateIncomeInput = z.infer<typeof createIncomeSchema>;
export type UpdateIncomeInput = z.infer<typeof updateIncomeSchema>;

export const incomeTemplateParamsSchema = z.object({
  id: z.string().cuid(),
  templateId: z.string().cuid(),
});

export const createIncomeTemplateSchema = z.object({
  tenantId: z.string().cuid(),
  amount: z.number().positive().max(999_999_999.99),
  label: z.string().trim().min(1).max(100),
  note: z.string().trim().max(500).optional(),
  householdId: z.string().cuid(),
});

export const updateIncomeTemplateSchema = z
  .object({
    amount: z.number().positive().max(999_999_999.99).optional(),
    label: z.string().trim().min(1).max(100).optional(),
    note: z.string().trim().max(500).nullable().optional(),
    active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateIncomeTemplateInput = z.infer<typeof createIncomeTemplateSchema>;
export type UpdateIncomeTemplateInput = z.infer<typeof updateIncomeTemplateSchema>;
