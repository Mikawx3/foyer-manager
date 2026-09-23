import type { AuthResponse } from "@foyer/types";
import { getHouseholds, getTenants } from "./api.ts";

export function readInviteReturnPath(state: unknown): string | null {
  if (typeof state !== "object" || state === null || !("from" in state)) {
    return null;
  }
  const from = state.from;
  if (typeof from !== "string" || !from.startsWith("/invite/")) {
    return null;
  }
  return from;
}

export async function resolveAuthDestination(householdId: string): Promise<string> {
  const tenants = await getTenants(householdId);
  const activeTenants = tenants.filter((tenant) => tenant.active);

  if (activeTenants.length === 0) {
    return `/households/${householdId}/onboarding`;
  }

  return `/households/${householdId}/dashboard`;
}

export async function resolvePostLoginPath(): Promise<string> {
  const households = await getHouseholds();
  if (households.length === 0) {
    return "/households/new";
  }
  if (households.length === 1) {
    const only = households[0];
    if (only) {
      return resolveAuthDestination(only.id);
    }
  }
  return "/households";
}

export async function resolveGoogleAuthPath(response: AuthResponse): Promise<string> {
  if (response.isNewAccount && response.householdId) {
    return `/households/${response.householdId}/onboarding`;
  }
  return resolvePostLoginPath();
}
