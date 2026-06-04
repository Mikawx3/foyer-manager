import { z } from "zod";

const splitItemSchema = z.object({
  tenantId: z.string().cuid(),
  percentage: z.number().positive().max(100),
});

export const createExpenseSchema = z
  .object({
    amount: z.number().positive().max(999_999_999.99),
    description: z.string().trim().min(1).max(500),
    categoryId: z.string().cuid(),
    paidByTenantId: z.string().cuid(),
    householdId: z.string().cuid(),
    date: z.string().date(),
    splitMode: z.enum(["default", "custom"]).default("default"),
    splits: z.array(splitItemSchema).optional(),
  })
  .refine(
    (data) => {
      if (data.splitMode !== "custom") {
        return true;
      }
      if (!data.splits || data.splits.length === 0) {
        return false;
      }
      const tenantIds = data.splits.map((split) => split.tenantId);
      return new Set(tenantIds).size === tenantIds.length;
    },
    { message: "Custom split requires unique tenants", path: ["splits"] },
  )
  .refine(
    (data) => {
      if (data.splitMode !== "custom" || !data.splits) {
        return true;
      }
      return data.splits.reduce((sum, split) => sum + split.percentage, 0) === 100;
    },
    { message: "Split percentages must sum to exactly 100", path: ["splits"] },
  );

export const expenseIdParamSchema = z.object({
  id: z.string().cuid(),
});

const MAX_EXPENSE_PAGE_LIMIT = 100;

export const listExpensesQuerySchema = z.object({
  householdId: z.string().cuid(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(MAX_EXPENSE_PAGE_LIMIT)
    .default(10),
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Use YYYY-MM format")
    .optional(),
  categoryId: z.string().cuid().optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;
