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

export interface Expense {
  id: string;
  amount: number;
  description: string;
  categoryId: string;
  paidByTenantId: string;
  householdId: string;
  date: string;
  createdAt: string;
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
