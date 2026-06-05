import type { TenantBalance } from "@foyer/types";
import { describe, expect, it } from "vitest";
import { applySettlements } from "./apply-settlements.ts";

const baseBalances: TenantBalance[] = [
  {
    tenantId: "t1",
    tenantName: "Alice",
    paid: 120,
    owed: 60,
    balance: 60,
    settledAmount: 0,
  },
  {
    tenantId: "t2",
    tenantName: "Bob",
    paid: 0,
    owed: 60,
    balance: -60,
    settledAmount: 0,
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
        balance: 0,
        settledAmount: 0,
      },
      {
        tenantId: "t2",
        tenantName: "Bob",
        paid: 0,
        owed: 60,
        balance: 0,
        settledAmount: 60,
      },
    ]);
  });
});
