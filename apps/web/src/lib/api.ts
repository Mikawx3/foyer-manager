import type {
  Category,
  Expense,
  ExpenseSplit,
  Household,
  Tenant,
  TenantBalance,
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

export async function getExpenses(householdId: string): Promise<Expense[]> {
  const { data } = await api.get<Expense[]>("/expenses", {
    params: { householdId },
  });
  return data;
}

export async function createExpense(input: {
  amount: number;
  description: string;
  categoryId: string;
  paidByTenantId: string;
  householdId: string;
  date: string;
}): Promise<Expense> {
  const { data } = await api.post<Expense>("/expenses", input);
  return data;
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

export async function getBalances(householdId: string): Promise<TenantBalance[]> {
  const { data } = await api.get<TenantBalance[]>(`/households/${householdId}/balances`);
  return data;
}
