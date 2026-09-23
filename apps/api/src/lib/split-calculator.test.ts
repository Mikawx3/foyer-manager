import { describe, expect, it } from "vitest";
import { ValidationError } from "../errors/app.errors.js";
import {
  assertPercentagesSumTo100,
  buildEqualDefaultSplits,
  calculateSplitAmounts,
  computeTenantBalances,
  memberJoinedBy,
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
        { tenantId: "t1", paidByTenantId: "t1", amount: 60 },
        { tenantId: "t2", paidByTenantId: "t1", amount: 60 },
      ],
    );

    expect(balances).toEqual([
      {
        tenantId: "t1",
        tenantName: "",
        paid: 120,
        owed: 60,
        personalShare: 60,
        paidForOthers: 60,
        owedToOthers: 0,
        balance: 60,
        settledAmount: 0,
        settledReceived: 0,
      },
      {
        tenantId: "t2",
        tenantName: "",
        paid: 0,
        owed: 60,
        personalShare: 0,
        paidForOthers: 0,
        owedToOthers: 60,
        balance: -60,
        settledAmount: 0,
        settledReceived: 0,
      },
    ]);
  });

  it("computeTenantBalances treats a fully self-assigned expense as neutral", () => {
    const [balance] = computeTenantBalances(
      [{ id: "t1" }, { id: "t2" }],
      [{ paidByTenantId: "t1", amount: 80 }],
      [{ tenantId: "t1", paidByTenantId: "t1", amount: 80 }],
    );

    expect(balance).toMatchObject({
      paid: 80,
      owed: 80,
      personalShare: 80,
      paidForOthers: 0,
      owedToOthers: 0,
      balance: 0,
    });
  });

  it("computeTenantBalances excludes personal spending from the shared decomposition", () => {
    const balances = computeTenantBalances(
      [{ id: "t1" }, { id: "t2" }],
      [
        { paidByTenantId: "t1", amount: 200 },
        { paidByTenantId: "t1", amount: 50 },
      ],
      [
        { tenantId: "t1", paidByTenantId: "t1", amount: 100 },
        { tenantId: "t2", paidByTenantId: "t1", amount: 100 },
        { tenantId: "t1", paidByTenantId: "t1", amount: 50 },
      ],
    );

    expect(balances[0]).toMatchObject({
      paid: 250,
      owed: 150,
      personalShare: 150,
      paidForOthers: 100,
      owedToOthers: 0,
      balance: 100,
    });
    expect(balances[1]).toMatchObject({
      paidForOthers: 0,
      owedToOthers: 100,
      balance: -100,
    });
  });
});

describe("memberJoinedBy", () => {
  it("includes a member who joined before the expense was recorded the same day", () => {
    expect(
      memberJoinedBy(
        new Date("2026-03-01T16:00:00.000Z"),
        new Date("2026-03-01T17:00:00.000Z"),
      ),
    ).toBe(true);
  });

  it("excludes a member who joined later the same day", () => {
    expect(
      memberJoinedBy(
        new Date("2026-03-23T17:00:00.000Z"),
        new Date("2026-03-23T16:00:00.000Z"),
      ),
    ).toBe(false);
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
