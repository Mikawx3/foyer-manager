import type { SplitPreview } from "@foyer/types";
import { equalSplitPercentages } from "./split-percentages.ts";

export interface TenantRef {
  id: string;
  name: string;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function calculateSplitAmounts(total: number, percentages: number[]): number[] {
  if (percentages.length === 0) {
    return [];
  }

  const amounts: number[] = [];
  let allocated = 0;

  for (let index = 0; index < percentages.length - 1; index += 1) {
    const percentage = percentages[index];
    if (percentage === undefined) {
      continue;
    }
    const memberAmount = round2((total * percentage) / 100);
    amounts.push(memberAmount);
    allocated += memberAmount;
  }

  amounts.push(round2(total - allocated));
  return amounts;
}

function rescalePercentages(
  selectedIds: string[],
  baseRules: { tenantId: string; percentage: number }[],
): number[] {
  const baseByTenant = new Map(baseRules.map((rule) => [rule.tenantId, rule.percentage]));
  const basePcts = selectedIds.map((id) => baseByTenant.get(id) ?? 0);
  const totalBase = basePcts.reduce((sum, value) => sum + value, 0);

  if (totalBase === 0) {
    return equalSplitPercentages(selectedIds.length);
  }

  const raw = basePcts.map((pct) => (pct / totalBase) * 100);

  if (raw.length === 1) {
    return [100];
  }

  const maxIndex = raw.reduce(
    (best, value, index) => ((raw[best] ?? 0) < value ? index : best),
    0,
  );

  const percentages = raw.map(() => 0);
  let roundedSum = 0;

  for (let index = 0; index < raw.length; index += 1) {
    if (index === maxIndex) {
      continue;
    }
    const pct = round2(raw[index] ?? 0);
    percentages[index] = pct;
    roundedSum += pct;
  }

  percentages[maxIndex] = round2(100 - roundedSum);
  return percentages;
}

export function redistributeSplits(
  tenants: TenantRef[],
  selectedIds: string[],
  baseRules: { tenantId: string; percentage: number }[],
  amount: number,
): SplitPreview[] {
  const tenantById = new Map(tenants.map((tenant) => [tenant.id, tenant]));
  const percentages = rescalePercentages(selectedIds, baseRules);
  const amounts = calculateSplitAmounts(amount, percentages);

  return selectedIds.map((tenantId, index) => {
    const tenant = tenantById.get(tenantId);
    const pct = percentages[index];
    const memberAmount = amounts[index];
    if (pct === undefined || memberAmount === undefined) {
      throw new Error("Failed to compute redistributed splits");
    }
    return {
      tenantId,
      tenantName: tenant?.name ?? tenantId,
      percentage: pct,
      amount: memberAmount,
    };
  });
}
