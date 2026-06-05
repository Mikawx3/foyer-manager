import type { Category, Expense, Tenant, TenantBalance } from "@foyer/types";
import { getCategoryHexForName } from "./category-colors.ts";
import { computeSuggestedSettlements } from "./suggested-settlements.ts";
import { DEFAULT_TENANT_COLOR } from "./tenant-colors.ts";

const BALANCE_NEUTRAL_FILL = "#6b7280";

function getTenantChartColor(tenant: Tenant | undefined): string {
  return tenant?.color ?? DEFAULT_TENANT_COLOR;
}

export interface DashboardKpis {
  totalThisMonth: number;
  expenseCountThisMonth: number;
  largestExpense: { description: string; amount: number } | null;
  mostIndebted: { name: string; balance: number } | null;
  allSettled: boolean;
  pendingSettlementCount: number;
}

export interface CategorySpendingSlice {
  name: string;
  value: number;
  fill: string;
}

export interface MonthlyTrendPoint {
  label: string;
  total: number;
  monthKey: string;
}

export interface BalanceChartBar {
  name: string;
  balance: number;
  fill: string;
}

/** Calendar date from `YYYY-MM-DD` or API ISO datetime (date portion only, local calendar). */
function parseExpenseDate(isoDate: string): Date {
  const dateOnly = isoDate.slice(0, 10);
  const [yearStr, monthStr, dayStr] = dateOnly.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr ?? "1");
  return new Date(year, month - 1, day);
}

function isSameCalendarMonth(expenseDate: string, reference: Date): boolean {
  const date = parseExpenseDate(expenseDate);
  return (
    date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth()
  );
}

function expenseMonthKey(isoDate: string): string {
  const date = parseExpenseDate(isoDate);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function shortMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
}

export function filterExpensesThisMonth(
  expenses: Expense[],
  referenceDate: Date = new Date(),
): Expense[] {
  return expenses.filter((expense) => isSameCalendarMonth(expense.date, referenceDate));
}

export function computeDashboardKpis(
  monthExpenses: Expense[],
  balances: TenantBalance[],
  tenantNameById: Map<string, string>,
): DashboardKpis {
  const totalThisMonth = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const expenseCountThisMonth = monthExpenses.length;

  let largestExpense: DashboardKpis["largestExpense"] = null;
  for (const expense of monthExpenses) {
    if (largestExpense === null || expense.amount > largestExpense.amount) {
      largestExpense = { description: expense.description, amount: expense.amount };
    }
  }

  let mostIndebted: DashboardKpis["mostIndebted"] = null;
  let minBalance = Infinity;
  for (const row of balances) {
    if (row.balance < minBalance) {
      minBalance = row.balance;
      mostIndebted = {
        name: tenantNameById.get(row.tenantId) ?? row.tenantId,
        balance: row.balance,
      };
    }
  }

  const allSettled = balances.length === 0 || minBalance >= 0;
  const pendingSettlementCount = computeSuggestedSettlements(balances).length;

  return {
    totalThisMonth,
    expenseCountThisMonth,
    largestExpense,
    mostIndebted: allSettled ? null : mostIndebted,
    allSettled,
    pendingSettlementCount,
  };
}

export function computeCategorySpending(
  expenses: Expense[],
  categories: Category[],
): CategorySpendingSlice[] {
  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]));
  const totalsByCategoryId = new Map<string, number>();

  for (const expense of expenses) {
    const current = totalsByCategoryId.get(expense.categoryId) ?? 0;
    totalsByCategoryId.set(expense.categoryId, current + expense.amount);
  }

  const slices: CategorySpendingSlice[] = [];
  for (const [categoryId, value] of totalsByCategoryId) {
    const name = categoryNameById.get(categoryId) ?? "Unknown";
    slices.push({
      name,
      value,
      fill: getCategoryHexForName(name),
    });
  }

  return slices.sort((a, b) => b.value - a.value);
}

export function computeMonthlyTrend(
  expenses: Expense[],
  referenceDate: Date = new Date(),
): MonthlyTrendPoint[] {
  const points: MonthlyTrendPoint[] = [];

  for (let offset = 5; offset >= 0; offset -= 1) {
    const monthDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - offset, 1);
    const key = monthKey(monthDate);
    const total = expenses
      .filter((expense) => expenseMonthKey(expense.date) === key)
      .reduce((sum, expense) => sum + expense.amount, 0);

    points.push({
      label: shortMonthLabel(monthDate),
      total,
      monthKey: key,
    });
  }

  return points;
}

export function computeBalanceChartData(
  balances: TenantBalance[],
  tenants: Tenant[],
): BalanceChartBar[] {
  const tenantById = new Map(tenants.map((tenant) => [tenant.id, tenant]));

  return balances.map((row) => {
    const balance = row.balance;
    const tenant = tenantById.get(row.tenantId);
    let fill = getTenantChartColor(tenant);
    if (balance === 0) {
      fill = BALANCE_NEUTRAL_FILL;
    }

    return {
      name: tenant?.name ?? row.tenantName ?? row.tenantId,
      balance,
      fill,
    };
  });
}
