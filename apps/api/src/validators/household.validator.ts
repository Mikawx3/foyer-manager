import { z } from "zod";

export const settlementPeriodSchema = z.enum(["none", "monthly", "quarterly", "yearly"]);

export const householdTypeSchema = z.enum(["solo", "shared"]);

export const createHouseholdSchema = z.object({
  name: z.string().trim().min(1).max(255),
  type: householdTypeSchema,
  settlementPeriod: settlementPeriodSchema,
});

export const updateHouseholdSchema = z.object({
  settlementPeriod: settlementPeriodSchema,
});

export const householdIdParamSchema = z.object({
  id: z.string().cuid(),
});

export type CreateHouseholdInput = z.infer<typeof createHouseholdSchema>;
export type UpdateHouseholdInput = z.infer<typeof updateHouseholdSchema>;
