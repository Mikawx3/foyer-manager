import type { TenantBalance } from "@foyer/types";
import { describe, expect, it } from "vitest";
import { computeSuggestedSettlements } from "./suggested-settlements.ts";

describe("computeSuggestedSettlements", () => {
  it("suggests minimum payments from debtors to creditors", () => {
    const balances: TenantBalance[] = [
      {
        tenantId: "alice",
        tenantName: "Alice",
        paid: 200,
        owed: 80,
        balance: 120,
        settledAmount: 0,
      },
      {
        tenantId: "bob",
        tenantName: "Bob",
        paid: 0,
        owed: 100,
        balance: -100,
        settledAmount: 0,
      },
      {
        tenantId: "charlie",
        tenantName: "Charlie",
        paid: 0,
        owed: 20,
        balance: -20,
        settledAmount: 0,
      },
    ];

    expect(computeSuggestedSettlements(balances)).toEqual([
      { fromTenantId: "bob", toTenantId: "alice", amount: 100 },
      { fromTenantId: "charlie", toTenantId: "alice", amount: 20 },
    ]);
  });
});
