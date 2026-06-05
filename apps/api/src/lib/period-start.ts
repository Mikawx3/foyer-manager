import type { SettlementPeriod } from "@foyer/types";

export function getPeriodStart(
  period: SettlementPeriod,
  now: Date = new Date(),
): Date | null {
  if (period === "none") {
    return null;
  }

  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();

  if (period === "monthly") {
    return new Date(Date.UTC(year, month, 1));
  }

  if (period === "quarterly") {
    const quarterStartMonth = Math.floor(month / 3) * 3;
    return new Date(Date.UTC(year, quarterStartMonth, 1));
  }

  return new Date(Date.UTC(year, 0, 1));
}
