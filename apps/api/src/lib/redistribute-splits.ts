import type { ResolvedDefaultSplit, SplitPreview } from "@foyer/types";
import { round2 } from "./decimal.js";
import { calculateSplitAmounts } from "./split-calculator.js";

export interface TenantRef {
  id: string;
  name: string;
}

function equalSplitPercentages(count: number): number[] {
  if (count === 0) {
    return [];
  }
  const per = Math.floor(100 / count);
  const percentages = Array.from({ length: count }, () => per);
  const last = percentages[count - 1];
  if (last !== undefined) {
    percentages[count - 1] = 100 - per * (count - 1);
  }
  return percentages;
}

function rescalePercentages(
  selectedIds: string[],
  baseRules: ResolvedDefaultSplit[],
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
  baseRules: ResolvedDefaultSplit[],
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

export function redistributeSplitsToItems(
  selectedIds: string[],
  baseRules: ResolvedDefaultSplit[],
): { tenantId: string; percentage: number }[] {
  const percentages = rescalePercentages(selectedIds, baseRules);
  return selectedIds.map((tenantId, index) => ({
    tenantId,
    percentage: percentages[index] ?? 0,
  }));
}
