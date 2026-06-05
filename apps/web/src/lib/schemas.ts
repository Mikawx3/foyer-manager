import { z } from "zod";

export const createHouseholdSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
});

export const createTenantSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  email: z.union([z.literal(""), z.string().trim().email("Invalid email").max(255)]),
  householdId: z.string().cuid(),
});

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  householdId: z.string().cuid(),
});

const splitItemSchema = z.object({
  tenantId: z.string().cuid(),
  percentage: z.number().positive().max(100),
});

const participantIdsSchema = z
  .array(z.string().cuid())
  .min(1, "At least one participant is required")
  .optional();

const expenseBodyFields = {
  amount: z.number().positive("Amount must be positive").max(999_999_999.99),
  description: z.string().trim().min(1, "Description is required").max(500),
  categoryId: z.string().cuid("Select a category"),
  paidByTenantId: z.string().cuid("Select who paid"),
  date: z.string().date("Use YYYY-MM-DD format"),
  splitMode: z.enum(["default", "custom"]),
  splits: z.array(splitItemSchema).optional(),
  participantIds: participantIdsSchema,
};

function withExpenseSplitRefinements<T extends z.ZodType<{ splitMode: "default" | "custom"; splits?: { tenantId: string; percentage: number }[]; participantIds?: string[] }>>(
  schema: T,
) {
  return schema
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
      { message: "Custom split requires unique members", path: ["splits"] },
    )
    .refine(
      (data) => {
        if (data.splitMode !== "custom" || !data.splits) {
          return true;
        }
        return data.splits.reduce((sum, split) => sum + split.percentage, 0) === 100;
      },
      { message: "Percentages must sum to exactly 100", path: ["splits"] },
    )
    .refine(
      (data) => {
        if (data.splitMode !== "custom" || !data.splits || !data.participantIds) {
          return true;
        }
        const allowed = new Set(data.participantIds);
        return data.splits.every((split) => allowed.has(split.tenantId));
      },
      { message: "Splits must only include selected participants", path: ["splits"] },
    );
}

export const createExpenseSchema = withExpenseSplitRefinements(
  z.object({
    ...expenseBodyFields,
    householdId: z.string().cuid(),
  }),
);

export const updateExpenseSchema = withExpenseSplitRefinements(z.object(expenseBodyFields));

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

const recurringFrequencySchema = z.enum(["weekly", "monthly", "quarterly", "yearly"]);

const recurringExpenseBodyFields = {
  title: z.string().trim().min(1, "Title is required").max(500),
  amount: z.number().positive("Amount must be positive").max(999_999_999.99),
  category: z.string().cuid("Select a category"),
  paidById: z.string().cuid("Select who pays"),
  frequency: recurringFrequencySchema,
  startDate: z.string().date("Use YYYY-MM-DD format"),
  splits: z.array(splitItemSchema).min(1),
};

function withRecurringSplitRefinements<
  T extends z.ZodType<{ splits?: { tenantId: string; percentage: number }[] }>,
>(schema: T) {
  return schema.refine(
    (data) => {
      if (!data.splits || data.splits.length === 0) {
        return true;
      }
      return Math.abs(data.splits.reduce((sum, split) => sum + split.percentage, 0) - 100) < 0.01;
    },
    { message: "Percentages must sum to exactly 100", path: ["splits"] },
  );
}

export const createRecurringExpenseSchema = withRecurringSplitRefinements(
  z.object(recurringExpenseBodyFields),
);

export const updateRecurringExpenseSchema = withRecurringSplitRefinements(
  z.object({
    title: recurringExpenseBodyFields.title.optional(),
    amount: recurringExpenseBodyFields.amount.optional(),
    category: recurringExpenseBodyFields.category.optional(),
    paidById: recurringExpenseBodyFields.paidById.optional(),
    frequency: recurringExpenseBodyFields.frequency.optional(),
    startDate: recurringExpenseBodyFields.startDate.optional(),
    splits: z.array(splitItemSchema).min(1).optional(),
    active: z.boolean().optional(),
  }),
);

export type CreateHouseholdForm = z.infer<typeof createHouseholdSchema>;
export type CreateTenantForm = z.infer<typeof createTenantSchema>;
export type CreateCategoryForm = z.infer<typeof createCategorySchema>;
export type CreateExpenseForm = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseForm = z.infer<typeof updateExpenseSchema>;
export type AssignSplitsForm = z.infer<typeof assignSplitsSchema>;
export type CreateRecurringExpenseForm = z.infer<typeof createRecurringExpenseSchema>;
export type UpdateRecurringExpenseForm = z.infer<typeof updateRecurringExpenseSchema>;
