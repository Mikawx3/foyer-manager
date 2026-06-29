import { describe, expect, it } from "vitest";
import {
  aggregateIncomeByTenant,
  computeSavingsRate,
  savingsRateTone,
  shiftMonth,
} from "./income-stats.ts";

describe("income-stats", () => {
  it("computeSavingsRate returns 0 when no income", () => {
    expect(computeSavingsRate(0, 500)).toBe(0);
  });

  it("computeSavingsRate calculates percentage correctly", () => {
    expect(computeSavingsRate(1000, 800)).toBe(20);
  });

  it("shiftMonth moves forward and backward", () => {
    expect(shiftMonth("2026-01", 1)).toBe("2026-02");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });

  it("savingsRateTone applies thresholds", () => {
    expect(savingsRateTone(25)).toBe("positive");
    expect(savingsRateTone(15)).toBe("warning");
    expect(savingsRateTone(5)).toBe("negative");
  });

  it("aggregateIncomeByTenant sums per member", () => {
    const totals = aggregateIncomeByTenant([
      {
        id: "1",
        householdId: "h",
        tenantId: "a",
        amount: 1000,
        label: "Salary",
        month: "2026-06",
        source: "template",
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "2",
        householdId: "h",
        tenantId: "a",
        amount: 200,
        label: "Freelance",
        month: "2026-06",
        source: "one-off",
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "3",
        householdId: "h",
        tenantId: "b",
        amount: 800,
        label: "Salary",
        month: "2026-06",
        source: "template",
        createdAt: "",
        updatedAt: "",
      },
    ]);
    expect(totals.get("a")).toBe(1200);
    expect(totals.get("b")).toBe(800);
  });
});
