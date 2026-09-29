import { ForbiddenError } from "../errors/app.errors.js";

/** A guest with no household yet may create one. A guest who already belongs to one may not. */
export function assertGuestMayCreateHousehold(isGuest: boolean, membershipCount: number): void {
  if (isGuest && membershipCount > 0) {
    throw new ForbiddenError("Guests cannot create a household");
  }
}
