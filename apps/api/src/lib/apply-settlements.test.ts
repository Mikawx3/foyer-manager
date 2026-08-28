import type { TenantBalance } from "@foyer/types";
import { describe, expect, it } from "vitest";
import { applySettlements } from "./apply-settlements.ts";

const baseBalances: TenantBalance[] = [
  {
    tenantId: "t1",
    tenantName: "Alice",
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
    tenantName: "Bob",
    paid: 0,
    owed: 60,
    personalShare: 0,
    paidForOthers: 0,
    owedToOthers: 60,
    balance: -60,
    settledAmount: 0,
    settledReceived: 0,
  },
];

describe("applySettlements", () => {
  it("adjusts balances and tracks settled amounts", () => {
    const result = applySettlements(baseBalances, [
      { fromTenantId: "t2", toTenantId: "t1", amount: 60 },
    ]);

    expect(result).toEqual([
      {
        tenantId: "t1",
        tenantName: "Alice",
        paid: 120,
        owed: 60,
        personalShare: 60,
        paidForOthers: 60,
        owedToOthers: 0,
        balance: 0,
        settledAmount: 0,
        settledReceived: 60,
      },
      {
        tenantId: "t2",
        tenantName: "Bob",
        paid: 0,
        owed: 60,
        personalShare: 0,
        paidForOthers: 0,
        owedToOthers: 60,
        balance: 0,
        settledAmount: 60,
        settledReceived: 0,
      },
    ]);
  });

  it("flips the balance when a member reimburses more than they owed", () => {
    const result = applySettlements(baseBalances, [
      { fromTenantId: "t2", toTenantId: "t1", amount: 100 },
    ]);

    expect(result[0]).toMatchObject({ balance: -40, settledReceived: 100 });
    expect(result[1]).toMatchObject({ balance: 40, settledAmount: 100 });
  });
});
