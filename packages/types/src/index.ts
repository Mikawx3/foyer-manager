export type SettlementPeriod = "none" | "monthly" | "quarterly" | "yearly";

export type HouseholdType = "solo" | "shared";

export interface Household {
  id: string;
  name: string;
  type: HouseholdType;
  settlementPeriod: SettlementPeriod;
  createdAt: string;
}

export interface HouseholdDeletionPreview {
  memberCount: number;
  expenseCount: number;
  expenseTotal: number;
  recurringExpenseCount: number;
  membersWithUnresolvedBalance: number;
  outstandingBalanceTotal: number;
}

export interface CreateHouseholdPayload {
  name: string;
  type: HouseholdType;
  settlementPeriod: SettlementPeriod;
}

export interface Settlement {
  id: string;
  householdId: string;
  fromTenantId: string;
  toTenantId: string;
  amount: number;
  note: string | null;
  date: string;
  createdAt: string;
}

export interface CreateSettlementPayload {
  fromTenantId: string;
  toTenantId: string;
  amount: number;
  note?: string;
  date?: string;
}

export interface UpdateHouseholdPayload {
  settlementPeriod?: SettlementPeriod;
  type?: HouseholdType;
}

export interface UpdateTenantPayload {
  name?: string;
  color?: string;
  active?: boolean;
}

/** Household member (not a rental tenant). */
export interface Tenant {
  id: string;
  name: string;
  email: string;
  color?: string | null;
  active: boolean;
  archivedAt?: string | null;
  householdId: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  householdId: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  householdName: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthUser {
  userId: string;
  email: string;
  householdId: string;
  household: Household;
}

export type DeploymentMode = "local" | "cloud";

export interface AppConfig {
  deploymentMode: DeploymentMode;
}

export interface CreateTenantPayload {
  name: string;
  email?: string;
  color?: string;
  householdId: string;
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

export interface SplitPreview {
  tenantId: string;
  tenantName: string;
  percentage: number;
  amount: number;
}

export interface CreateExpensePayload {
  amount: number;
  description: string;
  categoryId: string;
  paidByTenantId: string;
  householdId: string;
  date: string;
  splitMode?: SplitMode;
  splits?: { tenantId: string; percentage: number }[];
  participantIds?: string[];
}

export interface UpdateExpensePayload {
  amount: number;
  description: string;
  categoryId: string;
  paidByTenantId: string;
  date: string;
  splitMode?: SplitMode;
  splits?: { tenantId: string; percentage: number }[];
  participantIds?: string[];
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  categoryId: string;
  paidByTenantId: string;
  householdId: string;
  recurringExpenseId?: string | null;
  splitMode: SplitMode;
  date: string;
  createdAt: string;
}

export type RecurringFrequency = "weekly" | "monthly" | "quarterly" | "yearly";

export interface RecurringExpenseSplit {
  tenantId: string;
  tenant: { id: string; name: string };
  percentage: number;
}

export interface RecurringExpense {
  id: string;
  householdId: string;
  title: string;
  amount: number;
  category?: string;
  paidById: string;
  paidBy: { id: string; name: string };
  frequency: RecurringFrequency;
  startDate: string;
  nextDueDate: string;
  active: boolean;
  splits: RecurringExpenseSplit[];
  generatedExpenseCount: number;
  createdAt: string;
}

export interface CreateRecurringExpensePayload {
  title: string;
  amount: number;
  category?: string;
  paidById: string;
  frequency: RecurringFrequency;
  startDate: string;
  splits?: { tenantId: string; percentage: number }[];
}

export interface UpdateRecurringExpensePayload {
  title?: string;
  amount?: number;
  category?: string | null;
  paidById?: string;
  frequency?: RecurringFrequency;
  startDate?: string;
  nextDueDate?: string;
  active?: boolean;
  splits?: { tenantId: string; percentage: number }[];
}

export interface PaginatedExpenses {
  data: Expense[];
  total: number;
  page: number;
  totalPages: number;
  recurringGeneratedCount?: number;
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
  tenantName: string;
  paid: number;
  owed: number;
  balance: number;
  settledAmount: number;
}
