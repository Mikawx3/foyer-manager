import type { Household, Tenant } from "@foyer/types";
import type { Household as PrismaHousehold, Tenant as PrismaTenant } from "@prisma/client";

export function toHouseholdDto(household: PrismaHousehold): Household {
  return {
    id: household.id,
    name: household.name,
    createdAt: household.createdAt.toISOString(),
  };
}

export function toTenantDto(tenant: PrismaTenant): Tenant {
  return {
    id: tenant.id,
    name: tenant.name,
    email: tenant.email,
    householdId: tenant.householdId,
    createdAt: tenant.createdAt.toISOString(),
  };
}
