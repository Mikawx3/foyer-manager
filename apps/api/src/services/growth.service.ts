import type { GrowthStats } from "@foyer/types";
import { bucketGrowthByDay, growthWindowStart } from "../lib/growth-stats.js";
import { growthRepository, type GrowthRepository } from "../repositories/growth.repository.js";

export class GrowthService {
  constructor(private readonly repository: GrowthRepository = growthRepository) {}

  async getStats(days: number, now: Date = new Date()): Promise<GrowthStats> {
    const [totals, timestamps] = await Promise.all([
      this.repository.countTotals(),
      this.repository.listCreatedSince(growthWindowStart(now, days)),
    ]);

    return {
      generatedAt: now.toISOString(),
      windowDays: days,
      totals,
      daily: bucketGrowthByDay(timestamps, now, days),
    };
  }
}

export const growthService = new GrowthService();
