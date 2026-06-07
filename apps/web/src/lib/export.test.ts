import type { Expense, ExpenseSplit, Tenant } from "@foyer/types";
import type { TFunction } from "i18next";
import { describe, expect, it } from "vitest";
import {
  buildExpensesCsv,
  formatExportAmount,
  formatExportDate,
  slugifyHouseholdName,
} from "./export.ts";

const sampleExpense: Expense = {
  id: "exp-1",
  amount: 42.5,
  description: 'Coffee, "special"',
  categoryId: "cat-1",
  paidByTenantId: "tenant-1",
  householdId: "hh-1",
  splitMode: "default",
  date: "2026-06-15T10:00:00.000Z",
  createdAt: "2026-06-15T10:00:00.000Z",
};

const tenants: Tenant[] = [
  {
    id: "tenant-1",
    name: "Alice",
    email: "alice@example.com",
    active: true,
    householdId: "hh-1",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "tenant-2",
    name: "Bob",
    email: "bob@example.com",
    active: true,
    householdId: "hh-1",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

const tExport = ((key: string) => {
  const labels: Record<string, string> = {
    splitDefault: "Auto (equal)",
  };
  return labels[key] ?? key;
}) as TFunction<"export">;

describe("formatExportDate", () => {
  it("formats ISO date as DD/MM/YYYY", () => {
    expect(formatExportDate("2026-06-15T10:00:00.000Z")).toBe("15/06/2026");
  });
});

describe("formatExportAmount", () => {
  it("uses comma as decimal separator with two decimals", () => {
    expect(formatExportAmount(42.5)).toBe("42,50");
    expect(formatExportAmount(10)).toBe("10,00");
  });
});

describe("slugifyHouseholdName", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(slugifyHouseholdName("Test Home")).toBe("test-home");
  });

  it("removes special characters", () => {
    expect(slugifyHouseholdName("My & House!")).toBe("my-house");
  });
});

const CSV_HEADERS = [
  "Date",
  "Description",
  "Category",
  "Amount (€)",
  "Paid by",
  "Split",
];

describe("buildExpensesCsv", () => {
  it("builds header and row with French amount and escaped description", () => {
    const csv = buildExpensesCsv(
      [sampleExpense],
      {
        categoryNameById: new Map([["cat-1", "Food"]]),
        tenantNameById: new Map([["tenant-1", "Alice"]]),
      },
      CSV_HEADERS,
      tenants,
      tExport,
    );

    const lines = csv.split("\n");
    expect(lines[0]).toBe("Date,Description,Category,Amount (€),Paid by,Split");
    expect(lines[1]).toContain("15/06/2026");
    expect(lines[1]).toContain('"Coffee, ""special"""');
    expect(lines[1]).toContain("Food");
    expect(lines[1]).toContain("42,50");
    expect(lines[1]).toContain("Alice");
    expect(lines[1]).toContain("Auto (equal)");
  });

  it("shows member percentages for custom splits", () => {
    const customExpense: Expense = {
      ...sampleExpense,
      splitMode: "custom",
      splits: [
        { id: "s1", expenseId: "exp-1", tenantId: "tenant-1", amount: 21.25, percentage: 50 },
        { id: "s2", expenseId: "exp-1", tenantId: "tenant-2", amount: 21.25, percentage: 50 },
      ] satisfies ExpenseSplit[],
    };

    const csv = buildExpensesCsv(
      [customExpense],
      {
        categoryNameById: new Map([["cat-1", "Food"]]),
        tenantNameById: new Map([
          ["tenant-1", "Alice"],
          ["tenant-2", "Bob"],
        ]),
      },
      CSV_HEADERS,
      tenants,
      tExport,
    );

    expect(csv.split("\n")[1]).toContain("Alice 50% / Bob 50%");
  });
});
