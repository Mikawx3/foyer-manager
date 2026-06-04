import { z } from "zod";

export const createHouseholdSchema = z.object({
  name: z.string().trim().min(1).max(255),
});

export const householdIdParamSchema = z.object({
  id: z.string().cuid(),
});

export type CreateHouseholdInput = z.infer<typeof createHouseholdSchema>;
