import type { Context } from "hono";
import { ForbiddenError } from "../errors/app.errors.js";
import { isLocalDeployment } from "./deployment.js";
import { getAuth } from "../middleware/auth.middleware.js";

export function assertHouseholdAccess(c: Context, householdId: string): void {
  if (isLocalDeployment()) {
    return;
  }

  const auth = getAuth(c);
  if (auth.householdId !== householdId) {
    throw new ForbiddenError("Access denied to this household");
  }
}
