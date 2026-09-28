import { describe, expect, it, vi } from "vitest";
import type { GrowthRepository } from "../repositories/growth.repository.js";
import { GrowthService } from "./growth.service.js";

describe("GrowthService", () => {
  it("combines totals with a daily breakdown over the requested window", async () => {
    const totals = {
      accounts: 2,
      googleAccounts: 1,
      guests: 1,
      households: 2,
      activatedHouseholds: 1,
      sharedHouseholds: 1,
      expenses: 3,
      invites: 1,
    };
    const repository: GrowthRepository = {
      countTotals: vi.fn().mockResolvedValue(totals),
      listCreatedSince: vi.fn().mockResolvedValue({
        accounts: [new Date("2026-09-28T08:00:00.000Z")],
        guests: [],
        households: [],
        invites: [],
        expenses: [],
      }),
    };

    const now = new Date("2026-09-28T17:30:00.000Z");
    const stats = await new GrowthService(repository).getStats(7, now);

    expect(repository.listCreatedSince).toHaveBeenCalledWith(new Date("2026-09-22T00:00:00.000Z"));
    expect(stats.totals).toEqual(totals);
    expect(stats.windowDays).toBe(7);
    expect(stats.daily).toHaveLength(7);
    expect(stats.daily.at(-1)).toMatchObject({ date: "2026-09-28", accounts: 1 });
  });
});
