import type { ExpenseSplit, Tenant } from "@foyer/types";

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
