import { describe, expect, it } from "vitest";
import { ValidationError } from "../errors/app.errors.js";
import {
  assertPercentagesSumTo100,
  calculateSplitAmounts,
  computeTenantBalances,
} from "./split-calculator.js";

describe("split-calculator", () => {
  it("assertPercentagesSumTo100 rejects sums other than 100", () => {
    expect(() => assertPercentagesSumTo100([50, 49])).toThrow(ValidationError);
  });

  it("calculateSplitAmounts splits 120 evenly at 50/50", () => {
    expect(calculateSplitAmounts(120, [50, 50])).toEqual([60, 60]);
  });

  it("calculateSplitAmounts assigns remainder to last split", () => {
    const amounts = calculateSplitAmounts(100, [33.33, 33.33, 33.34]);
    expect(amounts.reduce((sum, value) => sum + value, 0)).toBe(100);
  });

  it("computeTenantBalances calculates paid, owed, and balance", () => {
    const balances = computeTenantBalances(
      [{ id: "t1" }, { id: "t2" }],
      [{ paidByTenantId: "t1", amount: 120 }],
      [
        { tenantId: "t1", amount: 60 },
        { tenantId: "t2", amount: 60 },
      ],
    );

    expect(balances).toEqual([
      { tenantId: "t1", totalPaid: 120, totalOwed: 60, balance: 60 },
      { tenantId: "t2", totalPaid: 0, totalOwed: 60, balance: -60 },
    ]);
  });
});
