export type SettlementPeriod = "none" | "monthly" | "quarterly" | "yearly";

export type HouseholdType = "solo" | "shared";

export type HouseholdRole = "admin" | "member" | "guest";

/** Placeholder member created for a solo household. Replaced when the admin invites someone. */
export const SOLO_SELF_NAME = "Me";

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
  name?: string;
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
  /** True when an account is linked to this name in this household. */
  claimed: boolean;
  /** True when the signed-in account is the one linked to this name. */
  isCurrentUser: boolean;
}

export interface AuthResponse {
  token: string;
  householdId: string | null;
  isNewAccount?: boolean;
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

export interface GoogleAuthPayload {
  idToken: string;
  householdName?: string;
}

export interface HouseholdMembershipSummary {
  householdId: string;
  role: HouseholdRole;
}

export interface AuthUser {
  userId: string;
  email: string;
  isGuest: boolean;
  householdId: string | null;
  household: Household | null;
  memberships: HouseholdMembershipSummary[];
}

export interface HouseholdInviteCreated {
  token: string;
  expiresAt: string;
}

export interface InviteMemberOption {
  id: string;
  name: string;
  color: string | null;
  claimed: boolean;
}

export interface HouseholdInvitePreview {
  householdId: string;
  householdName: string;
  members: InviteMemberOption[];
}

export interface AcceptInviteResponse {
  householdId: string;
  token: string | null;
  tenantId: string;
}

export interface HouseholdAccessMember {
  userId: string;
  name: string;
  role: HouseholdRole;
  isGuest: boolean;
  email: string | null;
}

export type DeploymentMode = "local" | "cloud";

export interface AppConfig {
  deploymentMode: DeploymentMode;
  googleClientId: string | null;
}

export interface CreateTenantPayload {
  name: string;
  email?: string;
  color?: string;
  householdId: string;
}

export const CATEGORY_COLOR_KEYS = [
  "rent",
  "groceries",
  "utilities",
  "internet",
  "streaming",
  "water",
  "insurance",
  "transport",
  "health",
  "teal",
  "pink",
  "other",
] as const;

export type CategoryColorKey = (typeof CATEGORY_COLOR_KEYS)[number];

export interface Category {
  id: string;
  name: string;
  slug?: string | null;
  color: CategoryColorKey;
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
  splits?: ExpenseSplit[];
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
  /** Share of their own payments this member keeps for themselves: never owed to anyone. */
  personalShare: number;
  /** Money advanced on behalf of the other members (paid - personalShare). */
  paidForOthers: number;
  /** Share of the other members' payments charged to this member (owed - personalShare). */
  owedToOthers: number;
  balance: number;
  /** Settlements paid out by this member. */
  settledAmount: number;
  /** Settlements received by this member. */
  settledReceived: number;
}

export interface Income {
  id: string;
  householdId: string;
  tenantId: string;
  amount: number;
  label: string;
  month: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export type IncomeSource = "template" | "override" | "one-off";

/** Income resolved for a specific month (template + optional override). */
export interface ResolvedIncome {
  id: string;
  householdId: string;
  tenantId: string;
  amount: number;
  label: string;
  month: string;
  note?: string;
  source: IncomeSource;
  templateId?: string;
  overrideId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IncomeTemplate {
  id: string;
  householdId: string;
  tenantId: string;
  amount: number;
  label: string;
  note?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIncomeTemplatePayload {
  tenantId: string;
  amount: number;
  label: string;
  note?: string;
  householdId: string;
}

export interface UpdateIncomeTemplatePayload {
  amount?: number;
  label?: string;
  note?: string;
  active?: boolean;
}

export interface CreateIncomePayload {
  tenantId: string;
  amount: number;
  label: string;
  month: string;
  note?: string;
  householdId: string;
}

export interface UpdateIncomePayload {
  amount?: number;
  label?: string;
  note?: string;
}

export interface CategoryExpenseStat {
  categoryId: string;
  categorySlug: string;
  amount: number;
  sharePercent: number;
  expenseCount: number;
}

export interface ExpenseStats {
  month: string;
  totalExpenses: number;
  expenseCount: number;
  largestExpense: { description: string; amount: number } | null;
  byCategory: CategoryExpenseStat[];
  trend: { month: string; total: number }[];
}

export interface IncomeStats {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  savingsRate: number;
  remainingBudget: number;
  largestExpense: { description: string; amount: number } | null;
  byCategory: CategoryExpenseStat[];
  byTenant: {
    tenantId: string;
    tenantName: string;
    income: number;
    expenses: number;
    balance: number;
    savingsRate: number;
  }[];
  trend: {
    month: string;
    income: number;
    expenses: number;
    savings: number;
  }[];
}
