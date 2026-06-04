import { z } from "zod";

const splitItemSchema = z.object({
  tenantId: z.string().cuid(),
  percentage: z.number().positive().max(100),
});

const participantIdsSchema = z
  .array(z.string().cuid())
  .min(1, "At least one participant is required")
  .optional();

function participantIdsAreUnique(data: { participantIds?: string[] }): boolean {
  if (!data.participantIds) {
    return true;
  }
  return new Set(data.participantIds).size === data.participantIds.length;
}

function splitsMatchParticipants(data: {
  splitMode: "default" | "custom";
  splits?: { tenantId: string; percentage: number }[];
  participantIds?: string[];
}): boolean {
  if (data.splitMode !== "custom" || !data.splits) {
    return true;
  }
  const allowed = new Set(data.participantIds ?? []);
  if (allowed.size === 0) {
    return true;
  }
  return data.splits.every((split) => allowed.has(split.tenantId));
}

const expenseBodyFields = {
  amount: z.number().positive().max(999_999_999.99),
  description: z.string().trim().min(1).max(500),
  categoryId: z.string().cuid(),
  paidByTenantId: z.string().cuid(),
  date: z.string().date(),
  splitMode: z.enum(["default", "custom"]).default("default"),
  splits: z.array(splitItemSchema).optional(),
  participantIds: participantIdsSchema,
};

export const createExpenseSchema = z
  .object({
    ...expenseBodyFields,
    householdId: z.string().cuid(),
  })
  .refine(participantIdsAreUnique, {
    message: "Participant ids must be unique",
    path: ["participantIds"],
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
  )
  .refine(splitsMatchParticipants, {
    message: "Custom splits must only include selected participants",
    path: ["splits"],
  });

export const updateExpenseSchema = z
  .object(expenseBodyFields)
  .refine(participantIdsAreUnique, {
    message: "Participant ids must be unique",
    path: ["participantIds"],
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
  )
  .refine(splitsMatchParticipants, {
    message: "Custom splits must only include selected participants",
    path: ["splits"],
  });

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
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;
