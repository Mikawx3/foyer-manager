import type { Context } from "hono";
import { assertAdminToken } from "../lib/admin-access.js";
import { parseOrThrow } from "../lib/validation.js";
import { growthService, type GrowthService } from "../services/growth.service.js";
import { growthStatsQuerySchema } from "../validators/growth.validator.js";

export class AdminController {
  constructor(private readonly growth: GrowthService = growthService) {}

  stats = async (c: Context) => {
    assertAdminToken(c.req.header("Authorization"));
    const { days } = parseOrThrow(growthStatsQuerySchema, c.req.query());
    const stats = await this.growth.getStats(days);
    c.header("Cache-Control", "no-store");
    return c.json(stats, 200);
  };
}

export const adminController = new AdminController();
