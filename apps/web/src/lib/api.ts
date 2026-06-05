import type {
  Category,
  CreateExpensePayload,
  CreateSettlementPayload,
  DefaultSplit,
  DefaultSplitRules,
  Expense,
  ExpenseSplit,
  Household,
  CreateRecurringExpensePayload,
  PaginatedExpenses,
  RecurringExpense,
  ResolvedDefaultSplit,
  Settlement,
  Tenant,
  UpdateRecurringExpensePayload,
  TenantBalance,
  UpdateExpensePayload,
  UpdateHouseholdPayload,
} from "@foyer/types";
import axios, { isAxiosError } from "axios";

export interface ApiErrorBody {
  error: string;
  details?: unknown;
}

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

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
  return "Something went wrong";
}

export async function getHouseholds(): Promise<Household[]> {
  const { data } = await api.get<Household[]>("/households");
  return data;
}

export async function createHousehold(input: { name: string }): Promise<Household> {
  const { data } = await api.post<Household>("/households", input);
  return data;
}

export async function getHousehold(id: string): Promise<Household> {
  const { data } = await api.get<Household>(`/households/${id}`);
  return data;
}

export async function getTenants(householdId: string): Promise<Tenant[]> {
  const { data } = await api.get<Tenant[]>("/tenants", {
    params: { householdId },
  });
  return data;
}

export async function createTenant(input: {
  name: string;
  email: string;
  householdId: string;
}): Promise<Tenant> {
  const { data } = await api.post<Tenant>("/tenants", input);
  return data;
}

export async function deleteTenant(id: string): Promise<void> {
  await api.delete(`/tenants/${id}`);
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
      ...(params.month !== undefined && { month: params.month }),
      ...(params.categoryId !== undefined && params.categoryId !== "" && {
        categoryId: params.categoryId,
      }),
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
