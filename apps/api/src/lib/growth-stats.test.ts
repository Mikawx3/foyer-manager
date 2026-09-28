import { describe, expect, it } from "vitest";
import { bucketGrowthByDay, growthWindowStart } from "./growth-stats.js";

const empty = { accounts: [], guests: [], households: [], invites: [], expenses: [] };

describe("growthWindowStart", () => {
  it("starts at midnight UTC so the window includes today", () => {
    const start = growthWindowStart(new Date("2026-09-28T17:30:00.000Z"), 7);
    expect(start.toISOString()).toBe("2026-09-22T00:00:00.000Z");
  });
});

describe("bucketGrowthByDay", () => {
  const now = new Date("2026-09-28T17:30:00.000Z");

  it("returns one zeroed row per day, oldest first", () => {
    const rows = bucketGrowthByDay(empty, now, 3);
    expect(rows.map((row) => row.date)).toEqual(["2026-09-26", "2026-09-27", "2026-09-28"]);
    expect(rows.every((row) => row.accounts === 0 && row.expenses === 0)).toBe(true);
  });

  it("counts each metric on its UTC day", () => {
    const rows = bucketGrowthByDay(
      {
        ...empty,
        accounts: [new Date("2026-09-27T23:59:59.000Z"), new Date("2026-09-28T00:00:00.000Z")],
        expenses: [new Date("2026-09-28T10:00:00.000Z"), new Date("2026-09-28T11:00:00.000Z")],
      },
      now,
      2,
    );
    expect(rows).toEqual([
      { date: "2026-09-27", accounts: 1, guests: 0, households: 0, invites: 0, expenses: 0 },
      { date: "2026-09-28", accounts: 1, guests: 0, households: 0, invites: 0, expenses: 2 },
    ]);
  });

  it("ignores timestamps outside the window", () => {
    const rows = bucketGrowthByDay(
      { ...empty, households: [new Date("2026-09-01T12:00:00.000Z")] },
      now,
      2,
    );
    expect(rows.reduce((sum, row) => sum + row.households, 0)).toBe(0);
  });
});
