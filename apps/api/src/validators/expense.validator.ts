import { z } from "zod";

export const createExpenseSchema = z.object({
  amount: z.number().positive().max(999_999_999.99),
  description: z.string().trim().min(1).max(500),
  categoryId: z.string().cuid(),
  paidByTenantId: z.string().cuid(),
  householdId: z.string().cuid(),
  date: z.string().date(),
});

export const expenseIdParamSchema = z.object({
  id: z.string().cuid(),
});

export const listExpensesQuerySchema = z.object({
  householdId: z.string().cuid(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
