import type { Expense } from "@foyer/types";
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
  "Split mode",
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
    );

    const lines = csv.split("\n");
    expect(lines[0]).toBe("Date,Description,Category,Amount (€),Paid by,Split mode");
    expect(lines[1]).toContain("15/06/2026");
    expect(lines[1]).toContain('"Coffee, ""special"""');
    expect(lines[1]).toContain("Food");
    expect(lines[1]).toContain("42,50");
    expect(lines[1]).toContain("Alice");
    expect(lines[1]).toContain("default");
  });
});
