import type { Category, Expense, Tenant, TenantBalance } from "@foyer/types";
import { describe, expect, it } from "vitest";
import {
  computeBalanceChartData,
  computeCategorySpending,
  computeDashboardKpis,
  computeMonthlyTrend,
  filterExpensesThisMonth,
} from "./dashboard-stats.ts";

const referenceDate = new Date(2026, 5, 15);

const expenses: Expense[] = [
  {
    id: "e1",
    amount: 100,
    description: "Rent June",
    categoryId: "c-rent",
    paidByTenantId: "t1",
    householdId: "h1",
    date: "2026-06-01",
    createdAt: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "e2",
    amount: 50,
    description: "Groceries",
    categoryId: "c-groc",
    paidByTenantId: "t1",
    householdId: "h1",
    date: "2026-06-10",
    createdAt: "2026-06-10T00:00:00.000Z",
  },
  {
    id: "e3",
    amount: 200,
    description: "Old rent",
    categoryId: "c-rent",
    paidByTenantId: "t1",
    householdId: "h1",
    date: "2026-01-05",
    createdAt: "2026-01-05T00:00:00.000Z",
  },
];

const categories: Category[] = [
  { id: "c-rent", name: "Rent", householdId: "h1" },
  { id: "c-groc", name: "Groceries", householdId: "h1" },
];

const tenants: Tenant[] = [
  {
    id: "t1",
    name: "Alice",
    email: "alice@example.com",
    householdId: "h1",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "t2",
    name: "Bob",
    email: "bob@example.com",
    householdId: "h1",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

describe("filterExpensesThisMonth", () => {
  it("keeps only expenses in the reference month", () => {
    const filtered = filterExpensesThisMonth(expenses, referenceDate);
    expect(filtered).toHaveLength(2);
    expect(filtered.map((e) => e.id)).toEqual(["e1", "e2"]);
  });

  it("handles API ISO datetime strings", () => {
    const june = expenses[0];
    const january = expenses[2];
    expect(june).toBeDefined();
    expect(january).toBeDefined();

    const apiStyle: Expense[] = [
      { ...june!, date: "2026-06-01T00:00:00.000Z" },
      { ...january!, date: "2026-01-05T00:00:00.000Z" },
    ];
    const filtered = filterExpensesThisMonth(apiStyle, referenceDate);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe("e1");
  });
});

describe("computeDashboardKpis", () => {
  it("aggregates month totals and finds largest expense", () => {
    const monthExpenses = filterExpensesThisMonth(expenses, referenceDate);
    const balances: TenantBalance[] = [
      { tenantId: "t1", totalPaid: 150, totalOwed: 75, balance: 75 },
      { tenantId: "t2", totalPaid: 0, totalOwed: 75, balance: -75 },
    ];
    const tenantNames = new Map(tenants.map((t) => [t.id, t.name]));

    const kpis = computeDashboardKpis(monthExpenses, balances, tenantNames);

    expect(kpis.totalThisMonth).toBe(150);
    expect(kpis.expenseCountThisMonth).toBe(2);
    expect(kpis.largestExpense).toEqual({ description: "Rent June", amount: 100 });
    expect(kpis.mostIndebted).toEqual({ name: "Bob", balance: -75 });
    expect(kpis.allSettled).toBe(false);
  });

  it("marks all settled when no negative balances", () => {
    const balances: TenantBalance[] = [
      { tenantId: "t1", totalPaid: 100, totalOwed: 50, balance: 50 },
      { tenantId: "t2", totalPaid: 50, totalOwed: 50, balance: 0 },
    ];
    const tenantNames = new Map(tenants.map((t) => [t.id, t.name]));

    const kpis = computeDashboardKpis([], balances, tenantNames);

    expect(kpis.allSettled).toBe(true);
    expect(kpis.mostIndebted).toBeNull();
  });
});

describe("computeCategorySpending", () => {
  it("aggregates totals by category with colors", () => {
    const slices = computeCategorySpending(expenses, categories);
    expect(slices).toHaveLength(2);
    const rent = slices.find((s) => s.name === "Rent");
    const groceries = slices.find((s) => s.name === "Groceries");
    expect(rent?.value).toBe(300);
    expect(rent?.fill).toBe("#f43f5e");
    expect(groceries?.value).toBe(50);
    expect(groceries?.fill).toBe("#3b82f6");
  });
});

describe("computeMonthlyTrend", () => {
  it("returns six months ending at reference month", () => {
    const trend = computeMonthlyTrend(expenses, referenceDate);
    expect(trend).toHaveLength(6);
    const june = trend[5];
    const january = trend[0];
    expect(june?.label).toBe("Jun");
    expect(june?.total).toBe(150);
    expect(january?.total).toBe(200);
  });
});

describe("computeBalanceChartData", () => {
  it("assigns fill colors by balance sign", () => {
    const balances: TenantBalance[] = [
      { tenantId: "t1", totalPaid: 100, totalOwed: 50, balance: 50 },
      { tenantId: "t2", totalPaid: 0, totalOwed: 50, balance: -50 },
    ];
    const bars = computeBalanceChartData(balances, tenants);
    expect(bars[0]).toMatchObject({ name: "Alice", balance: 50, fill: "#10b981" });
    expect(bars[1]).toMatchObject({ name: "Bob", balance: -50, fill: "#f43f5e" });
  });
});
