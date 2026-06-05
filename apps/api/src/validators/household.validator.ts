import { z } from "zod";

export const settlementPeriodSchema = z.enum(["none", "monthly", "quarterly", "yearly"]);

export const createHouseholdSchema = z.object({
  name: z.string().trim().min(1).max(255),
});

export const updateHouseholdSchema = z.object({
  settlementPeriod: settlementPeriodSchema,
});

export const householdIdParamSchema = z.object({
  id: z.string().cuid(),
});

export type CreateHouseholdInput = z.infer<typeof createHouseholdSchema>;
export type UpdateHouseholdInput = z.infer<typeof updateHouseholdSchema>;
