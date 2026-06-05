import { z } from "zod";

export const balancesQuerySchema = z.object({
  period: z.enum(["all", "current"]).optional().default("all"),
});

export type BalancesQuery = z.infer<typeof balancesQuerySchema>;
