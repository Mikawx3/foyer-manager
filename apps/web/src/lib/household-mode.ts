import type { Household } from "@foyer/types";

export function isSoloHousehold(household: Household): boolean {
  return household.type === "solo";
}
