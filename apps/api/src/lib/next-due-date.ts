import type { RecurringFrequency } from "@foyer/types";

export function getNextDueDate(current: Date, frequency: RecurringFrequency): Date {
  const d = new Date(current);
  if (frequency === "weekly") {
    d.setUTCDate(d.getUTCDate() + 7);
  } else if (frequency === "monthly") {
    d.setUTCMonth(d.getUTCMonth() + 1);
  } else if (frequency === "quarterly") {
    d.setUTCMonth(d.getUTCMonth() + 3);
  } else if (frequency === "yearly") {
    d.setUTCFullYear(d.getUTCFullYear() + 1);
  }
  return d;
}
