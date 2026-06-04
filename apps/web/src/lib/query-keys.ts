import type { ExpenseListFilters } from "./expense-list-filters.ts";

export const queryKeys = {
  households: ["households"] as const,
  household: (id: string) => ["households", id] as const,
  tenants: (householdId: string) => ["tenants", householdId] as const,
  categories: (householdId: string) => ["categories", householdId] as const,
  expenses: (householdId: string, filters: ExpenseListFilters) =>
    ["expenses", householdId, filters] as const,
  expensesAll: (householdId: string) => ["expenses", householdId, "all"] as const,
  splits: (expenseId: string) => ["splits", expenseId] as const,
  balances: (householdId: string) => ["balances", householdId] as const,
  defaultSplits: (householdId: string) => ["default-splits", householdId] as const,
};
