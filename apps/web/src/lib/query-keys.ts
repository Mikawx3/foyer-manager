export const queryKeys = {
  households: ["households"] as const,
  household: (id: string) => ["households", id] as const,
  tenants: (householdId: string) => ["tenants", householdId] as const,
  categories: (householdId: string) => ["categories", householdId] as const,
  expenses: (householdId: string) => ["expenses", householdId] as const,
  splits: (expenseId: string) => ["splits", expenseId] as const,
  balances: (householdId: string) => ["balances", householdId] as const,
};
