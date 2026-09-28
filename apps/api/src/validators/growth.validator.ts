import { z } from "zod";

export const growthStatsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});
