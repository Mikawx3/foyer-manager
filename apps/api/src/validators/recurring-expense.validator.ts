import { z } from "zod";

const splitItemSchema = z.object({
  tenantId: z.string().cuid(),
  percentage: z.number().positive().max(100),
});

const recurringFrequencySchema = z.enum(["weekly", "monthly", "quarterly", "yearly"]);

export const recurringExpenseHouseholdParamSchema = z.object({
  id: z.string().cuid(),
});

export const recurringExpenseParamsSchema = z.object({
  id: z.string().cuid(),
  recurringId: z.string().cuid(),
});

export const createRecurringExpenseSchema = z
  .object({
    title: z.string().trim().min(1).max(500),
    amount: z.number().positive().max(999_999_999.99),
    category: z.string().cuid().optional(),
    paidById: z.string().cuid(),
    frequency: recurringFrequencySchema,
    startDate: z.string().date(),
    splits: z.array(splitItemSchema).optional(),
  })
  .refine(
    (data) => {
      if (!data.splits || data.splits.length === 0) {
        return true;
      }
      const sum = data.splits.reduce((total, split) => total + split.percentage, 0);
      return Math.abs(sum - 100) < 0.01;
    },
    { message: "Split percentages must sum to 100", path: ["splits"] },
  );

export const updateRecurringExpenseSchema = z
  .object({
    title: z.string().trim().min(1).max(500).optional(),
    amount: z.number().positive().max(999_999_999.99).optional(),
    category: z.string().cuid().nullable().optional(),
    paidById: z.string().cuid().optional(),
    frequency: recurringFrequencySchema.optional(),
    startDate: z.string().date().optional(),
    nextDueDate: z.string().date().optional(),
    active: z.boolean().optional(),
    splits: z.array(splitItemSchema).optional(),
  })
  .refine(
    (data) => {
      if (!data.splits || data.splits.length === 0) {
        return true;
      }
      const sum = data.splits.reduce((total, split) => total + split.percentage, 0);
      return Math.abs(sum - 100) < 0.01;
    },
    { message: "Split percentages must sum to 100", path: ["splits"] },
  );

export type CreateRecurringExpenseInput = z.infer<typeof createRecurringExpenseSchema>;
export type UpdateRecurringExpenseInput = z.infer<typeof updateRecurringExpenseSchema>;
