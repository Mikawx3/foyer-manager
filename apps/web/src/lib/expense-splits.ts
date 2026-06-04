import type { ExpenseSplit, Tenant } from "@foyer/types";

export function splitParticipantsFromExpenseSplits(
  tenants: Tenant[],
  splits: ExpenseSplit[],
): Tenant[] {
  if (splits.length === 0) {
    return tenants;
  }

  const splitIds = new Set(splits.map((split) => split.tenantId));
  return tenants.filter((tenant) => splitIds.has(tenant.id));
}

export function initialSplitsFromExpenseSplits(
  tenants: Tenant[],
  splits: ExpenseSplit[],
): { tenantId: string; percentage: number }[] {
  const participants = splitParticipantsFromExpenseSplits(tenants, splits);

  return participants.map((tenant) => {
    const split = splits.find((entry) => entry.tenantId === tenant.id);
    return {
      tenantId: tenant.id,
      percentage: split?.percentage ?? 0,
    };
  });
}

export function isExpenseSplitsComplete(
  splits: ExpenseSplit[],
  tenants: Tenant[],
): boolean {
  if (tenants.length === 0 || splits.length === 0) {
    return false;
  }

  const tenantIds = new Set(tenants.map((tenant) => tenant.id));
  const splitTenantIds = new Set(splits.map((split) => split.tenantId));

  if (splitTenantIds.size !== tenantIds.size) {
    return false;
  }

  for (const tenantId of tenantIds) {
    if (!splitTenantIds.has(tenantId)) {
      return false;
    }
  }

  if (!splits.every((split) => split.percentage !== undefined)) {
    return false;
  }

  const percentageSum = splits.reduce((sum, split) => sum + (split.percentage ?? 0), 0);
  return Math.abs(percentageSum - 100) < 0.01;
}
