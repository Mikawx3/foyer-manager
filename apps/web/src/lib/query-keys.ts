import type { ExpenseListFilters } from "./expense-list-filters.ts";

export const queryKeys = {
  config: ["config"] as const,
  me: ["auth", "me"] as const,
  households: ["households"] as const,
  household: (id: string) => ["households", id] as const,
  householdDeletionPreview: (householdId: string) =>
    ["households", householdId, "deletion-preview"] as const,
  tenants: (householdId: string) => ["tenants", householdId] as const,
  categories: (householdId: string) => ["categories", householdId] as const,
  expenses: (householdId: string, filters: ExpenseListFilters) =>
    ["expenses", householdId, filters] as const,
  expensesAll: (householdId: string) => ["expenses", householdId, "all"] as const,
  splits: (expenseId: string) => ["splits", expenseId] as const,
  balances: (householdId: string, period: "all" | "current" = "all") =>
    ["balances", householdId, period] as const,
  settlements: (householdId: string) => ["settlements", householdId] as const,
  recurringExpenses: (householdId: string) => ["recurring-expenses", householdId] as const,
  incomes: (householdId: string, month: string) => ["incomes", householdId, month] as const,
  incomeTemplates: (householdId: string) => ["income-templates", householdId] as const,
  incomeStats: (householdId: string, month: string) =>
    ["income-stats", householdId, month] as const,
  expenseStats: (householdId: string, month: string) =>
    ["expense-stats", householdId, month] as const,
  defaultSplits: (householdId: string) => ["default-splits", householdId] as const,
  resolvedDefaultSplits: (householdId: string, categoryId: string) =>
    ["default-splits", householdId, "resolve", categoryId] as const,
};
