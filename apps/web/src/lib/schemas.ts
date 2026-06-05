import type { TFunction } from "i18next";
import { z } from "zod";

function splitItemSchema() {
  return z.object({
    tenantId: z.string().cuid(),
    percentage: z.number().positive().max(100),
  });
}

function participantIdsSchema(t: TFunction<"validation">) {
  return z
    .array(z.string().cuid())
    .min(1, t("atLeastOneParticipant"))
    .optional();
}

function expenseBodyFields(t: TFunction<"validation">) {
  return {
    amount: z.number().positive(t("amountMustBePositive")).max(999_999_999.99),
    description: z.string().trim().min(1, t("descriptionRequired")).max(500),
    categoryId: z.string().cuid(t("selectCategory")),
    paidByTenantId: z.string().cuid(t("selectWhoPaid")),
    date: z.string().date(t("useDateFormat")),
    splitMode: z.enum(["default", "custom"]),
    splits: z.array(splitItemSchema()).optional(),
    participantIds: participantIdsSchema(t),
  };
}

function withExpenseSplitRefinements<
  T extends z.ZodType<{
    splitMode: "default" | "custom";
    splits?: { tenantId: string; percentage: number }[];
    participantIds?: string[];
  }>,
>(schema: T, t: TFunction<"validation">) {
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
      { message: t("customSplitUniqueMembers"), path: ["splits"] },
    )
    .refine(
      (data) => {
        if (data.splitMode !== "custom" || !data.splits) {
          return true;
        }
        return data.splits.reduce((sum, split) => sum + split.percentage, 0) === 100;
      },
      { message: t("percentagesMustSum100"), path: ["splits"] },
    )
    .refine(
      (data) => {
        if (data.splitMode !== "custom" || !data.splits || !data.participantIds) {
          return true;
        }
        const allowed = new Set(data.participantIds);
        return data.splits.every((split) => allowed.has(split.tenantId));
      },
      { message: t("splitsOnlyParticipants"), path: ["splits"] },
    );
}

export function createHouseholdSchema(t: TFunction<"validation">) {
  return z.object({
    name: z.string().trim().min(1, t("nameRequired")).max(255),
  });
}

export function createTenantSchema(t: TFunction<"validation">) {
  return z.object({
    name: z.string().trim().min(1, t("nameRequired")).max(255),
    email: z.union([z.literal(""), z.string().trim().email(t("invalidEmail")).max(255)]),
    householdId: z.string().cuid(),
  });
}

export function createCategorySchema(t: TFunction<"validation">) {
  return z.object({
    name: z.string().trim().min(1, t("nameRequired")).max(255),
    householdId: z.string().cuid(),
  });
}

export function createExpenseSchema(t: TFunction<"validation">) {
  return withExpenseSplitRefinements(
    z.object({
      ...expenseBodyFields(t),
      householdId: z.string().cuid(),
    }),
    t,
  );
}

export function updateExpenseSchema(t: TFunction<"validation">) {
  return withExpenseSplitRefinements(z.object(expenseBodyFields(t)), t);
}

export function assignSplitsSchema(t: TFunction<"validation">) {
  return z
    .object({
      splits: z.array(splitItemSchema()).min(1, t("addAtLeastOneSplit")),
    })
    .refine(
      (data) => {
        const tenantIds = data.splits.map((split) => split.tenantId);
        return new Set(tenantIds).size === tenantIds.length;
      },
      { message: t("eachTenantOnce"), path: ["splits"] },
    )
    .refine(
      (data) => data.splits.reduce((sum, split) => sum + split.percentage, 0) === 100,
      { message: t("percentagesMustSum100"), path: ["splits"] },
    );
}

const recurringFrequencySchema = z.enum(["weekly", "monthly", "quarterly", "yearly"]);

function recurringExpenseBodyFields(t: TFunction<"validation">) {
  return {
    title: z.string().trim().min(1, t("titleRequired")).max(500),
    amount: z.number().positive(t("amountMustBePositive")).max(999_999_999.99),
    category: z.string().cuid(t("selectCategory")),
    paidById: z.string().cuid(t("selectWhoPays")),
    frequency: recurringFrequencySchema,
    startDate: z.string().date(t("useDateFormat")),
    splits: z.array(splitItemSchema()).min(1),
  };
}

function withRecurringSplitRefinements<
  T extends z.ZodType<{ splits?: { tenantId: string; percentage: number }[] }>,
>(schema: T, t: TFunction<"validation">) {
  return schema.refine(
    (data) => {
      if (!data.splits || data.splits.length === 0) {
        return true;
      }
      return Math.abs(data.splits.reduce((sum, split) => sum + split.percentage, 0) - 100) < 0.01;
    },
    { message: t("percentagesMustSum100"), path: ["splits"] },
  );
}

export function createRecurringExpenseSchema(t: TFunction<"validation">) {
  return withRecurringSplitRefinements(z.object(recurringExpenseBodyFields(t)), t);
}

export function updateRecurringExpenseSchema(t: TFunction<"validation">) {
  const fields = recurringExpenseBodyFields(t);
  return withRecurringSplitRefinements(
    z.object({
      title: fields.title.optional(),
      amount: fields.amount.optional(),
      category: fields.category.optional(),
      paidById: fields.paidById.optional(),
      frequency: fields.frequency.optional(),
      startDate: fields.startDate.optional(),
      splits: z.array(splitItemSchema()).min(1).optional(),
      active: z.boolean().optional(),
    }),
    t,
  );
}

export type CreateHouseholdForm = z.infer<ReturnType<typeof createHouseholdSchema>>;
export type CreateTenantForm = z.infer<ReturnType<typeof createTenantSchema>>;
export type CreateCategoryForm = z.infer<ReturnType<typeof createCategorySchema>>;
export type CreateExpenseForm = z.infer<ReturnType<typeof createExpenseSchema>>;
export type UpdateExpenseForm = z.infer<ReturnType<typeof updateExpenseSchema>>;
export type AssignSplitsForm = z.infer<ReturnType<typeof assignSplitsSchema>>;
export type CreateRecurringExpenseForm = z.infer<ReturnType<typeof createRecurringExpenseSchema>>;
export type UpdateRecurringExpenseForm = z.infer<ReturnType<typeof updateRecurringExpenseSchema>>;
