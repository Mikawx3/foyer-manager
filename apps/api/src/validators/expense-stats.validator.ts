import { z } from "zod";
import { monthSchema } from "./income.validator.js";

export const expenseStatsHouseholdParamSchema = z.object({
  id: z.string().cuid(),
});

export const expenseStatsQuerySchema = z.object({
  month: monthSchema,
  participantScope: z.enum(["shared", "personal", "all"]).default("all"),
});
