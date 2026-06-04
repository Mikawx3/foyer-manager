import type { TenantBalance } from "@foyer/types";
import { ValidationError } from "../errors/app.errors.js";
import { round2 } from "./decimal.js";

export function assertPercentagesSumTo100(percentages: number[]): void {
  const sum = percentages.reduce((acc, value) => acc + value, 0);
  if (sum !== 100) {
    throw new ValidationError("Split percentages must sum to exactly 100", {
      sum,
      expected: 100,
    });
  }
}

export function calculateSplitAmounts(
  total: number,
  percentages: number[],
): number[] {
  assertPercentagesSumTo100(percentages);

  if (percentages.length === 0) {
    return [];
  }

  const amounts: number[] = [];
  let allocated = 0;

  for (let index = 0; index < percentages.length - 1; index += 1) {
    const percentage = percentages[index];
    if (percentage === undefined) {
      throw new ValidationError("Invalid split percentages");
    }
    const amount = round2((total * percentage) / 100);
    amounts.push(amount);
    allocated += amount;
  }

  const lastPercentage = percentages[percentages.length - 1];
  if (lastPercentage === undefined) {
    throw new ValidationError("Invalid split percentages");
  }
  amounts.push(round2(total - allocated));

  return amounts;
}

export interface BalanceExpenseInput {
  paidByTenantId: string;
  amount: number;
}

export interface BalanceSplitInput {
  tenantId: string;
  amount: number;
}

export interface BalanceTenantInput {
  id: string;
}

export function computeTenantBalances(
  tenants: BalanceTenantInput[],
  expenses: BalanceExpenseInput[],
  splits: BalanceSplitInput[],
): TenantBalance[] {
  const paidByTenant = new Map<string, number>();
  const owedByTenant = new Map<string, number>();

  for (const tenant of tenants) {
    paidByTenant.set(tenant.id, 0);
    owedByTenant.set(tenant.id, 0);
  }

  for (const expense of expenses) {
    const current = paidByTenant.get(expense.paidByTenantId) ?? 0;
    paidByTenant.set(expense.paidByTenantId, current + expense.amount);
  }

  for (const split of splits) {
    const current = owedByTenant.get(split.tenantId) ?? 0;
    owedByTenant.set(split.tenantId, current + split.amount);
  }

  return tenants.map((tenant) => {
    const totalPaid = paidByTenant.get(tenant.id) ?? 0;
    const totalOwed = owedByTenant.get(tenant.id) ?? 0;
    return {
      tenantId: tenant.id,
      totalPaid: round2(totalPaid),
      totalOwed: round2(totalOwed),
      balance: round2(totalPaid - totalOwed),
    };
  });
}
