import type { Tenant } from "@foyer/types";

export function formatTenantName(tenant: Pick<Tenant, "name" | "active">): string {
  if (!tenant.active) {
    return `${tenant.name} (archived)`;
  }
  return tenant.name;
}
