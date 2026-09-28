import type { GrowthDay } from "@foyer/types";
import type { GrowthTimestamps } from "../repositories/growth.repository.js";

const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function growthWindowStart(now: Date, days: number): Date {
  return new Date(startOfUtcDay(now).getTime() - (days - 1) * DAY_MS);
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Oldest day first, one row per UTC day including days without activity. */
export function bucketGrowthByDay(
  timestamps: GrowthTimestamps,
  now: Date,
  days: number,
): GrowthDay[] {
  const start = growthWindowStart(now, days);
  const rows = new Map<string, GrowthDay>();
  for (let index = 0; index < days; index += 1) {
    const date = dayKey(new Date(start.getTime() + index * DAY_MS));
    rows.set(date, { date, accounts: 0, guests: 0, households: 0, invites: 0, expenses: 0 });
  }

  const metrics = ["accounts", "guests", "households", "invites", "expenses"] as const;
  for (const metric of metrics) {
    for (const createdAt of timestamps[metric]) {
      const row = rows.get(dayKey(createdAt));
      if (row) {
        row[metric] += 1;
      }
    }
  }

  return [...rows.values()];
}
