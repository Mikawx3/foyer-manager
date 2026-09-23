import type { HouseholdRole } from "@foyer/types";
import type { Context } from "hono";
import { ForbiddenError } from "../errors/app.errors.js";
import { isLocalDeployment } from "./deployment.js";
import { getAuth } from "../middleware/auth.middleware.js";

export function assertHouseholdAccess(c: Context, householdId: string): HouseholdRole {
  if (isLocalDeployment()) {
    return "admin";
  }

  const auth = getAuth(c);
  const membership = auth.memberships.find((item) => item.householdId === householdId);
  if (!membership) {
    throw new ForbiddenError("Access denied to this household");
  }
  return membership.role;
}

export function assertHouseholdAdmin(c: Context, householdId: string): void {
  const role = assertHouseholdAccess(c, householdId);
  if (isLocalDeployment()) {
    return;
  }
  if (role !== "admin") {
    throw new ForbiddenError("Only an admin can do this");
  }
}
