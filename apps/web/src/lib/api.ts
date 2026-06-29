import type {
  AppConfig,
  AuthResponse,
  AuthUser,
  Category,
  CategoryColorKey,
  CreateExpensePayload,
  CreateHouseholdPayload,
  CreateIncomePayload,
  CreateSettlementPayload,
  DefaultSplit,
  DefaultSplitRules,
  Expense,
  ExpenseSplit,
  ExpenseStats,
  Household,
  HouseholdDeletionPreview,
  Income,
  IncomeStats,
  IncomeTemplate,
  CreateIncomeTemplatePayload,
  UpdateIncomeTemplatePayload,
  ResolvedIncome,
  CreateRecurringExpensePayload,
  LoginPayload,
  PaginatedExpenses,
  RecurringExpense,
  RegisterPayload,
  ResolvedDefaultSplit,
  Settlement,
  Tenant,
  UpdateTenantPayload,
  UpdateRecurringExpensePayload,
  TenantBalance,
  UpdateExpensePayload,
  UpdateHouseholdPayload,
  UpdateIncomePayload,
} from "@foyer/types";
import axios, { isAxiosError } from "axios";
import i18n from "../i18n.ts";
import { clearAuth, getToken } from "./auth-storage.ts";

export interface ApiErrorBody {
  error: string;
  details?: unknown;
}

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

let cachedDeploymentMode: AppConfig["deploymentMode"] | null = null;

export function getCachedDeploymentMode(): AppConfig["deploymentMode"] | null {
  return cachedDeploymentMode;
}

api.interceptors.request.use((config) => {
  if (getCachedDeploymentMode() === "local") {
    return config;
  }
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isAxiosError(error) && error.response?.status === 401) {
      clearAuth();
      if (
        getCachedDeploymentMode() !== "local" &&
        window.location.pathname !== "/login" &&
        window.location.pathname !== "/register"
      ) {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error: unknown): string {
  if (isAxiosError(error) && error.response?.data) {
    const data = error.response.data as ApiErrorBody;
    if (typeof data.error === "string") {
      return data.error;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return i18n.t("errors:somethingWentWrong");
}

export async function getConfig(): Promise<AppConfig> {
  const { data } = await api.get<AppConfig>("/config");
  cachedDeploymentMode = data.deploymentMode;
  return data;
}

export async function login(input: LoginPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", input);
  return data;
}

export async function register(input: RegisterPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register", input);
  return data;
}

export async function getMe(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>("/auth/me");
  return data;
}

export async function getHouseholds(): Promise<Household[]> {
  const { data } = await api.get<Household[]>("/households");
  return data;
}

export async function createHousehold(input: CreateHouseholdPayload): Promise<Household> {
  const { data } = await api.post<Household>("/households", input);
  return data;
}

export async function createHouseholdTenant(
  householdId: string,
  input: { name: string; color?: string; email?: string },
): Promise<Tenant> {
  const { data } = await api.post<Tenant>(`/households/${householdId}/tenants`, input);
  return data;
}

export async function getHousehold(id: string): Promise<Household> {
  const { data } = await api.get<Household>(`/households/${id}`);
  return data;
}

export async function getHouseholdDeletionPreview(
  householdId: string,
): Promise<HouseholdDeletionPreview> {
  const { data } = await api.get<HouseholdDeletionPreview>(
    `/households/${householdId}/deletion-preview`,
  );
  return data;
}

export async function getTenants(
  householdId: string,
  options?: { includeArchived?: boolean },
): Promise<Tenant[]> {
  const { data } = await api.get<Tenant[]>("/tenants", {
    params: {
      householdId,
      ...(options?.includeArchived && { includeArchived: true }),
    },
  });
  return data;
}

export async function createTenant(input: {
  name: string;
  email?: string;
  householdId: string;
}): Promise<Tenant> {
  const { data } = await api.post<Tenant>("/tenants", input);
  return data;
}

export async function deleteTenant(id: string): Promise<void> {
  await api.delete(`/tenants/${id}`);
}

export interface DeleteHouseholdTenantResult {
  tenant: Tenant;
  mode: "hard";
  switchedToSolo: boolean;
}

export interface UpdateHouseholdTenantResult {
  tenant: Tenant;
  switchedToSolo?: boolean;
  switchedToShared?: boolean;
}

export interface TenantRemovalPreview {
  balance: number;
  hasHistory: boolean;
  wouldSwitchToSolo: boolean;
}

export async function getTenantRemovalPreview(
  householdId: string,
  tenantId: string,
): Promise<TenantRemovalPreview> {
  const { data } = await api.get<TenantRemovalPreview>(
    `/households/${householdId}/tenants/${tenantId}/removal-preview`,
  );
  return data;
}

export async function deleteHouseholdTenant(
  householdId: string,
  tenantId: string,
): Promise<DeleteHouseholdTenantResult> {
  const { data } = await api.delete<DeleteHouseholdTenantResult>(
    `/households/${householdId}/tenants/${tenantId}`,
  );
  return data;
}

export async function updateHouseholdTenant(
  householdId: string,
  tenantId: string,
  input: UpdateTenantPayload,
): Promise<UpdateHouseholdTenantResult> {
  const { data } = await api.patch<UpdateHouseholdTenantResult>(
    `/households/${householdId}/tenants/${tenantId}`,
    input,
  );
  return data;
}

export async function getCategories(householdId: string): Promise<Category[]> {
  const { data } = await api.get<Category[]>("/categories", {
    params: { householdId },
  });
  return data;
}

export async function createCategory(input: {
  name: string;
  householdId: string;
  color?: CategoryColorKey;
}): Promise<Category> {
  const { data } = await api.post<Category>("/categories", input);
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  await api.delete(`/categories/${id}`);
}

export interface ExpenseListParams {
  page?: number;
  limit?: number;
  month?: string;
  categoryId?: string;
  search?: string;
}

export async function getExpenses(
  householdId: string,
  params: ExpenseListParams = {},
): Promise<PaginatedExpenses> {
  const { data } = await api.get<PaginatedExpenses>("/expenses", {
    params: {
      householdId,
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      ...(params.month !== undefined && params.month !== "" && { month: params.month }),
      ...(params.categoryId !== undefined && params.categoryId !== "" && {
        categoryId: params.categoryId,
      }),
      ...(params.search !== undefined && params.search !== "" && { search: params.search }),
    },
  });
  return data;
}

export async function createExpense(input: CreateExpensePayload): Promise<Expense> {
  const { data } = await api.post<Expense>("/expenses", input);
  return data;
}

export async function updateExpense(id: string, input: UpdateExpensePayload): Promise<Expense> {
  const { data } = await api.patch<Expense>(`/expenses/${id}`, input);
  return data;
}

export async function deleteExpense(id: string): Promise<void> {
  await api.delete(`/expenses/${id}`);
}

export async function createSplits(
  expenseId: string,
  input: { splits: { tenantId: string; percentage: number }[] },
): Promise<ExpenseSplit[]> {
  const { data } = await api.post<ExpenseSplit[]>(`/expenses/${expenseId}/splits`, input);
  return data;
}

export async function getSplits(expenseId: string): Promise<ExpenseSplit[]> {
  const { data } = await api.get<ExpenseSplit[]>(`/expenses/${expenseId}/splits`);
  return data;
}

export async function resetExpenseSplits(expenseId: string): Promise<ExpenseSplit[]> {
  const { data } = await api.post<ExpenseSplit[]>(`/expenses/${expenseId}/splits/reset`);
  return data;
}

export async function getDefaultSplits(householdId: string): Promise<DefaultSplitRules> {
  const { data } = await api.get<DefaultSplitRules>(`/households/${householdId}/default-splits`);
  return data;
}

export async function putDefaultSplits(
  householdId: string,
  input: {
    categoryId: string | null;
    splits: { tenantId: string; percentage: number }[];
  },
): Promise<DefaultSplit[]> {
  const { data } = await api.put<DefaultSplit[]>(
    `/households/${householdId}/default-splits`,
    input,
  );
  return data;
}

export async function deleteCategoryDefaultSplits(
  householdId: string,
  categoryId: string,
): Promise<void> {
  await api.delete(`/households/${householdId}/default-splits`, {
    params: { categoryId },
  });
}

export async function resolveDefaultSplits(
  householdId: string,
  categoryId: string,
): Promise<ResolvedDefaultSplit[]> {
  const { data } = await api.get<ResolvedDefaultSplit[]>(
    `/households/${householdId}/default-splits/resolve`,
    { params: { categoryId } },
  );
  return data;
}

export async function getBalances(
  householdId: string,
  period: "all" | "current" = "all",
): Promise<TenantBalance[]> {
  const { data } = await api.get<TenantBalance[]>(`/households/${householdId}/balances`, {
    params: { period },
  });
  return data;
}

export async function updateHousehold(
  id: string,
  input: UpdateHouseholdPayload,
): Promise<Household> {
  const { data } = await api.patch<Household>(`/households/${id}`, input);
  return data;
}

export async function deleteHousehold(id: string): Promise<Household> {
  const { data } = await api.delete<Household>(`/households/${id}`);
  return data;
}

export async function getSettlements(householdId: string): Promise<Settlement[]> {
  const { data } = await api.get<Settlement[]>(`/households/${householdId}/settlements`);
  return data;
}

export async function createSettlement(
  householdId: string,
  input: CreateSettlementPayload,
): Promise<Settlement> {
  const { data } = await api.post<Settlement>(`/households/${householdId}/settlements`, input);
  return data;
}

export async function deleteSettlement(
  householdId: string,
  settlementId: string,
): Promise<Settlement> {
  const { data } = await api.delete<Settlement>(
    `/households/${householdId}/settlements/${settlementId}`,
  );
  return data;
}

export async function getRecurringExpenses(householdId: string): Promise<RecurringExpense[]> {
  const { data } = await api.get<RecurringExpense[]>(
    `/households/${householdId}/recurring-expenses`,
  );
  return data;
}

export async function createRecurringExpense(
  householdId: string,
  input: CreateRecurringExpensePayload,
): Promise<RecurringExpense> {
  const { data } = await api.post<RecurringExpense>(
    `/households/${householdId}/recurring-expenses`,
    input,
  );
  return data;
}

export async function updateRecurringExpense(
  householdId: string,
  recurringId: string,
  input: UpdateRecurringExpensePayload,
): Promise<RecurringExpense> {
  const { data } = await api.patch<RecurringExpense>(
    `/households/${householdId}/recurring-expenses/${recurringId}`,
    input,
  );
  return data;
}

export async function deleteRecurringExpense(
  householdId: string,
  recurringId: string,
): Promise<RecurringExpense> {
  const { data } = await api.delete<RecurringExpense>(
    `/households/${householdId}/recurring-expenses/${recurringId}`,
  );
  return data;
}

export async function generateRecurringExpense(
  householdId: string,
  recurringId: string,
): Promise<Expense> {
  const { data } = await api.post<Expense>(
    `/households/${householdId}/recurring-expenses/${recurringId}/generate`,
  );
  return data;
}

export async function listIncomes(
  householdId: string,
  month: string,
): Promise<ResolvedIncome[]> {
  const { data } = await api.get<ResolvedIncome[]>(`/households/${householdId}/incomes`, {
    params: { month },
  });
  return data;
}

export async function listIncomeTemplates(householdId: string): Promise<IncomeTemplate[]> {
  const { data } = await api.get<IncomeTemplate[]>(
    `/households/${householdId}/incomes/templates`,
  );
  return data;
}

export async function createIncomeTemplate(
  householdId: string,
  payload: CreateIncomeTemplatePayload,
): Promise<IncomeTemplate> {
  const { data } = await api.post<IncomeTemplate>(
    `/households/${householdId}/incomes/templates`,
    payload,
  );
  return data;
}

export async function updateIncomeTemplate(
  householdId: string,
  templateId: string,
  payload: UpdateIncomeTemplatePayload,
): Promise<IncomeTemplate> {
  const { data } = await api.patch<IncomeTemplate>(
    `/households/${householdId}/incomes/templates/${templateId}`,
    payload,
  );
  return data;
}

export async function deleteIncomeTemplate(
  householdId: string,
  templateId: string,
): Promise<IncomeTemplate> {
  const { data } = await api.delete<IncomeTemplate>(
    `/households/${householdId}/incomes/templates/${templateId}`,
  );
  return data;
}

export async function createIncome(
  householdId: string,
  payload: CreateIncomePayload,
): Promise<Income> {
  const { data } = await api.post<Income>(`/households/${householdId}/incomes`, payload);
  return data;
}

export async function updateIncome(
  householdId: string,
  incomeId: string,
  payload: UpdateIncomePayload,
): Promise<Income> {
  const { data } = await api.patch<Income>(
    `/households/${householdId}/incomes/${incomeId}`,
    payload,
  );
  return data;
}

export async function deleteIncome(householdId: string, incomeId: string): Promise<Income> {
  const { data } = await api.delete<Income>(
    `/households/${householdId}/incomes/${incomeId}`,
  );
  return data;
}

export async function getIncomeStats(householdId: string, month: string): Promise<IncomeStats> {
  const { data } = await api.get<IncomeStats>(`/households/${householdId}/incomes/stats`, {
    params: { month },
  });
  return data;
}

export async function getExpenseStats(
  householdId: string,
  month: string,
): Promise<ExpenseStats> {
  const { data } = await api.get<ExpenseStats>(`/households/${householdId}/expenses/stats`, {
    params: { month },
  });
  return data;
}
