import type { TenantBalance } from "@foyer/types";
import { round2 } from "./decimal.js";

export interface SettlementBalanceInput {
  fromTenantId: string;
  toTenantId: string;
  amount: number;
}

export function applySettlements(
  balances: TenantBalance[],
  settlements: SettlementBalanceInput[],
): TenantBalance[] {
  const balanceByTenant = new Map(
    balances.map((row) => [row.tenantId, { ...row }]),
  );

  const settledByTenant = new Map<string, number>();
  for (const row of balances) {
    settledByTenant.set(row.tenantId, 0);
  }

  for (const settlement of settlements) {
    const fromRow = balanceByTenant.get(settlement.fromTenantId);
    const toRow = balanceByTenant.get(settlement.toTenantId);

    if (fromRow) {
      fromRow.balance = round2(fromRow.balance + settlement.amount);
      settledByTenant.set(
        settlement.fromTenantId,
        round2((settledByTenant.get(settlement.fromTenantId) ?? 0) + settlement.amount),
      );
    }

    if (toRow) {
      toRow.balance = round2(toRow.balance - settlement.amount);
    }
  }

  return balances.map((row) => {
    const updated = balanceByTenant.get(row.tenantId) ?? row;
    return {
      ...updated,
      balance: round2(updated.balance),
      settledAmount: round2(settledByTenant.get(row.tenantId) ?? 0),
    };
  });
}
