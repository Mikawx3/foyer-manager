export interface Household {
  id: string;
  name: string;
  createdAt: string;
}

/** Household member (not a rental tenant). */
export interface Tenant {
  id: string;
  name: string;
  email: string;
  householdId: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  householdId: string;
}

export type SplitMode = "default" | "custom";

export interface DefaultSplit {
  id: string;
  householdId: string;
  categoryId: string | null;
  tenantId: string;
  percentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface DefaultSplitRules {
  global: DefaultSplit[];
  byCategory: Record<string, DefaultSplit[]>;
}

export interface ResolvedDefaultSplit {
  tenantId: string;
  percentage: number;
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  categoryId: string;
  paidByTenantId: string;
  householdId: string;
  splitMode: SplitMode;
  date: string;
  createdAt: string;
}

export interface PaginatedExpenses {
  data: Expense[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ExpenseSplit {
  id: string;
  expenseId: string;
  tenantId: string;
  amount: number;
  percentage?: number;
}

export interface TenantBalance {
  tenantId: string;
  totalPaid: number;
  totalOwed: number;
  balance: number;
}
