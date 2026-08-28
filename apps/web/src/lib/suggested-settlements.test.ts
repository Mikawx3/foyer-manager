import type { TenantBalance } from "@foyer/types";
import { describe, expect, it } from "vitest";
import { computeSuggestedSettlements } from "./suggested-settlements.ts";

/** Balance row with no personal spending and no settlement yet. */
function balanceRow(
  row: Pick<TenantBalance, "tenantId" | "tenantName" | "paid" | "owed" | "balance">,
): TenantBalance {
  return {
    ...row,
    personalShare: 0,
    paidForOthers: row.paid,
    owedToOthers: row.owed,
    settledAmount: 0,
    settledReceived: 0,
  };
}

describe("computeSuggestedSettlements", () => {
  it("suggests minimum payments from debtors to creditors", () => {
    const balances: TenantBalance[] = [
      balanceRow({
        tenantId: "alice",
        tenantName: "Alice",
        paid: 200,
        owed: 80,
        balance: 120,
      }),
      balanceRow({
        tenantId: "bob",
        tenantName: "Bob",
        paid: 0,
        owed: 100,
        balance: -100,
      }),
      balanceRow({
        tenantId: "charlie",
        tenantName: "Charlie",
        paid: 0,
        owed: 20,
        balance: -20,
      }),
    ];

    expect(computeSuggestedSettlements(balances)).toEqual([
      { fromTenantId: "bob", toTenantId: "alice", amount: 100 },
      { fromTenantId: "charlie", toTenantId: "alice", amount: 20 },
    ]);
  });
});
