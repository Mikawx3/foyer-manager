import { z } from "zod";

export const createHouseholdSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
});

export const createTenantSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  email: z.string().trim().email("Invalid email").max(255),
  householdId: z.string().cuid(),
});

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  householdId: z.string().cuid(),
});

export const createExpenseSchema = z.object({
  amount: z.number().positive("Amount must be positive").max(999_999_999.99),
  description: z.string().trim().min(1, "Description is required").max(500),
  categoryId: z.string().cuid("Select a category"),
  paidByTenantId: z.string().cuid("Select who paid"),
  householdId: z.string().cuid(),
  date: z.string().date("Use YYYY-MM-DD format"),
});

const splitItemSchema = z.object({
  tenantId: z.string().cuid(),
  percentage: z.number().positive().max(100),
});

export const assignSplitsSchema = z
  .object({
    splits: z.array(splitItemSchema).min(1, "Add at least one split"),
  })
  .refine(
    (data) => {
      const tenantIds = data.splits.map((split) => split.tenantId);
      return new Set(tenantIds).size === tenantIds.length;
    },
    { message: "Each tenant can only appear once", path: ["splits"] },
  )
  .refine(
    (data) => data.splits.reduce((sum, split) => sum + split.percentage, 0) === 100,
    { message: "Percentages must sum to exactly 100", path: ["splits"] },
  );

export type CreateHouseholdForm = z.infer<typeof createHouseholdSchema>;
export type CreateTenantForm = z.infer<typeof createTenantSchema>;
export type CreateCategoryForm = z.infer<typeof createCategorySchema>;
export type CreateExpenseForm = z.infer<typeof createExpenseSchema>;
export type AssignSplitsForm = z.infer<typeof assignSplitsSchema>;
