import type { Tenant } from "@foyer/types";

export function getActiveTenants(tenants: Tenant[]): Tenant[] {
  return tenants.filter((tenant) => tenant.active);
}
