import type { ResolvedIncome } from "@foyer/types";

export function computeSavingsRate(totalIncome: number, totalExpenses: number): number {
  if (totalIncome <= 0) {
    return 0;
  }
  return ((totalIncome - totalExpenses) / totalIncome) * 100;
}

export type SavingsRateTone = "positive" | "warning" | "negative";

export function savingsRateTone(rate: number): SavingsRateTone {
  if (rate > 20) {
    return "positive";
  }
  if (rate >= 10) {
    return "warning";
  }
  return "negative";
}

export function shiftMonth(month: string, delta: number): string {
  const [yearStr, monthStr] = month.split("-");
  let year = Number(yearStr);
  let monthIndex = Number(monthStr) - 1 + delta;

  while (monthIndex < 0) {
    monthIndex += 12;
    year -= 1;
  }
  while (monthIndex > 11) {
    monthIndex -= 12;
    year += 1;
  }

  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

export function aggregateIncomeByTenant(incomes: ResolvedIncome[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const income of incomes) {
    totals.set(income.tenantId, (totals.get(income.tenantId) ?? 0) + income.amount);
  }
  return totals;
}

export function parseMonthKey(month: string): Date {
  const [yearStr, monthStr] = month.split("-");
  return new Date(Number(yearStr), Number(monthStr) - 1, 1);
}

export function formatMonthLabel(month: string, locale: string): string {
  const date = parseMonthKey(month);
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(date);
}
