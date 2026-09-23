import type { HouseholdRole } from "@foyer/types";
import { z } from "zod";
import { InternalError } from "../errors/app.errors.js";

const householdRoleSchema = z.enum(["admin", "member", "guest"]);

export function parseHouseholdRole(role: string): HouseholdRole {
  const parsed = householdRoleSchema.safeParse(role);
  if (!parsed.success) {
    throw new InternalError("Invalid household role");
  }
  return parsed.data;
}
