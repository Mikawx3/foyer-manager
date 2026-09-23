import type { Tenant } from "@prisma/client";
import { ConflictError, NotFoundError } from "../errors/app.errors.js";
import type { TenantRepository } from "../repositories/tenant.repository.js";

export async function claimTenantForUser(
  tenants: TenantRepository,
  householdId: string,
  tenantId: string,
  userId: string,
): Promise<Tenant> {
  const tenant = await tenants.findById(tenantId);
  if (!tenant || tenant.householdId !== householdId || !tenant.active) {
    throw new NotFoundError("Member not found");
  }
  if (tenant.userId === userId) {
    return tenant;
  }
  if (tenant.userId !== null) {
    throw new ConflictError("This member is already linked to an account");
  }

  const already = await tenants.findByHouseholdAndUser(householdId, userId);
  if (already && already.id !== tenant.id) {
    throw new ConflictError("You already represent a member in this household");
  }

  const claimed = await tenants.claimIfUnclaimed(tenant.id, householdId, userId);
  if (!claimed) {
    throw new ConflictError("This member is already linked to an account");
  }

  const updated = await tenants.findById(tenant.id);
  if (!updated) {
    throw new NotFoundError("Member not found");
  }
  return updated;
}
