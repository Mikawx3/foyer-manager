import type { TenantBalance } from "@foyer/types";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface SuggestedSettlement {
  fromTenantId: string;
  toTenantId: string;
  amount: number;
}

export function computeSuggestedSettlements(
  balances: TenantBalance[],
): SuggestedSettlement[] {
  const debtors = balances
    .filter((row) => row.balance < 0)
    .map((row) => ({ tenantId: row.tenantId, amount: round2(-row.balance) }))
    .sort((a, b) => b.amount - a.amount);

  const creditors = balances
    .filter((row) => row.balance > 0)
    .map((row) => ({ tenantId: row.tenantId, amount: round2(row.balance) }))
    .sort((a, b) => b.amount - a.amount);

  const suggestions: SuggestedSettlement[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    if (!debtor || !creditor) {
      break;
    }

    const payment = round2(Math.min(debtor.amount, creditor.amount));
    if (payment > 0) {
      suggestions.push({
        fromTenantId: debtor.tenantId,
        toTenantId: creditor.tenantId,
        amount: payment,
      });
    }

    debtor.amount = round2(debtor.amount - payment);
    creditor.amount = round2(creditor.amount - payment);

    if (debtor.amount <= 0) {
      debtorIndex += 1;
    }
    if (creditor.amount <= 0) {
      creditorIndex += 1;
    }
  }

  return suggestions;
}
