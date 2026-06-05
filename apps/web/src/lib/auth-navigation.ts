import { getMe, getTenants } from "./api.ts";

export async function resolveAuthDestination(householdId: string): Promise<string> {
  const tenants = await getTenants(householdId);
  const activeTenants = tenants.filter((tenant) => tenant.active);

  if (activeTenants.length === 0) {
    return `/households/${householdId}/onboarding`;
  }

  return `/households/${householdId}/dashboard`;
}

export async function resolvePostLoginPath(): Promise<string> {
  const me = await getMe();
  return resolveAuthDestination(me.householdId);
}
