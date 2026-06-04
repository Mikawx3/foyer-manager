import type { ExpenseSplit, Tenant } from "@foyer/types";
import { describe, expect, it } from "vitest";
import { isExpenseSplitsComplete } from "./expense-splits.ts";

const tenants: Tenant[] = [
  {
    id: "t1",
    name: "Alice",
    email: "a@test.com",
    householdId: "h1",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "t2",
    name: "Bob",
    email: "b@test.com",
    householdId: "h1",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

describe("isExpenseSplitsComplete", () => {
  it("returns false when no splits", () => {
    expect(isExpenseSplitsComplete([], tenants)).toBe(false);
  });

  it("returns false when not all members are included", () => {
    const splits: ExpenseSplit[] = [
      { id: "s1", expenseId: "e1", tenantId: "t1", amount: 60, percentage: 100 },
    ];
    expect(isExpenseSplitsComplete(splits, tenants)).toBe(false);
  });

  it("returns false when percentages do not sum to 100", () => {
    const splits: ExpenseSplit[] = [
      { id: "s1", expenseId: "e1", tenantId: "t1", amount: 30, percentage: 50 },
      { id: "s2", expenseId: "e1", tenantId: "t2", amount: 30, percentage: 40 },
    ];
    expect(isExpenseSplitsComplete(splits, tenants)).toBe(false);
  });

  it("returns true when every member has a split totaling 100%", () => {
    const splits: ExpenseSplit[] = [
      { id: "s1", expenseId: "e1", tenantId: "t1", amount: 60, percentage: 50 },
      { id: "s2", expenseId: "e1", tenantId: "t2", amount: 60, percentage: 50 },
    ];
    expect(isExpenseSplitsComplete(splits, tenants)).toBe(true);
  });
});
