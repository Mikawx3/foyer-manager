import { describe, expect, it } from "vitest";
import { ValidationError } from "../errors/app.errors.js";
import {
  assertPercentagesSumTo100,
  buildEqualDefaultSplits,
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
      {
        tenantId: "t1",
        tenantName: "",
        paid: 120,
        owed: 60,
        balance: 60,
        settledAmount: 0,
      },
      {
        tenantId: "t2",
        tenantName: "",
        paid: 0,
        owed: 60,
        balance: -60,
        settledAmount: 0,
      },
    ]);
  });
});

describe("split-calculator — equal fallback", () => {
  it("falls back to equal split when no DefaultSplit rows exist (2 members)", () => {
    const tenants = [{ id: "t1" }, { id: "t2" }];
    const splits = buildEqualDefaultSplits(tenants);
    const percentages = splits.map((split) => split.percentage);
    const amounts = calculateSplitAmounts(100, percentages);

    expect(amounts).toEqual([50, 50]);
  });

  it("falls back to equal split when no DefaultSplit rows exist (3 members)", () => {
    const tenants = [{ id: "t1" }, { id: "t2" }, { id: "t3" }];
    const splits = buildEqualDefaultSplits(tenants);
    const percentages = splits.map((split) => split.percentage);
    const amounts = calculateSplitAmounts(100, percentages);

    expect(amounts).toEqual([33, 33, 34]);
  });

  it("does NOT apply fallback when DefaultSplit rows exist", () => {
    const amounts = calculateSplitAmounts(100, [70, 30]);

    expect(amounts).toEqual([70, 30]);
  });

  it("does NOT apply fallback when activeTenants is empty", () => {
    expect(buildEqualDefaultSplits([])).toEqual([]);
  });
});
