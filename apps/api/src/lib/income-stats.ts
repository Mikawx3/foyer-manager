import type { ResolvedIncome } from "@foyer/types";
import { decimalToNumber } from "./decimal.js";
import type { Income as PrismaIncome, IncomeTemplate as PrismaIncomeTemplate } from "@prisma/client";

export function computeSavingsRate(totalIncome: number, totalExpenses: number): number {
  if (totalIncome <= 0) {
    return 0;
  }
  return ((totalIncome - totalExpenses) / totalIncome) * 100;
}

export function last6MonthKeys(month: string): string[] {
  const [yearStr, monthStr] = month.split("-");
  let year = Number(yearStr);
  let monthIndex = Number(monthStr) - 1;

  const keys: string[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    let y = year;
    let m = monthIndex - i;
    while (m < 0) {
      m += 12;
      y -= 1;
    }
    keys.push(`${y}-${String(m + 1).padStart(2, "0")}`);
  }
  return keys;
}

function overrideKey(tenantId: string, label: string): string {
  return `${tenantId}::${label}`;
}

export function resolveIncomesForMonth(
  templates: PrismaIncomeTemplate[],
  overrides: PrismaIncome[],
  month: string,
): ResolvedIncome[] {
  const activeTemplates = templates.filter((template) => template.active);
  const monthOverrides = overrides.filter((income) => income.month === month);
  const overrideByKey = new Map(
    monthOverrides.map((income) => [overrideKey(income.tenantId, income.label), income]),
  );
  const coveredKeys = new Set<string>();
  const resolved: ResolvedIncome[] = [];

  for (const template of activeTemplates) {
    const key = overrideKey(template.tenantId, template.label);
    const override = overrideByKey.get(key);
    coveredKeys.add(key);

    if (override) {
      resolved.push({
        id: override.id,
        householdId: override.householdId,
        tenantId: override.tenantId,
        amount: decimalToNumber(override.amount),
        label: override.label,
        month,
        ...(override.note !== null && { note: override.note }),
        source: "override",
        templateId: template.id,
        overrideId: override.id,
        createdAt: override.createdAt.toISOString(),
        updatedAt: override.updatedAt.toISOString(),
      });
    } else {
      resolved.push({
        id: template.id,
        householdId: template.householdId,
        tenantId: template.tenantId,
        amount: decimalToNumber(template.amount),
        label: template.label,
        month,
        ...(template.note !== null && { note: template.note }),
        source: "template",
        templateId: template.id,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
      });
    }
  }

  for (const override of monthOverrides) {
    const key = overrideKey(override.tenantId, override.label);
    if (coveredKeys.has(key)) {
      continue;
    }
    resolved.push({
      id: override.id,
      householdId: override.householdId,
      tenantId: override.tenantId,
      amount: decimalToNumber(override.amount),
      label: override.label,
      month,
      ...(override.note !== null && { note: override.note }),
      source: "one-off",
      overrideId: override.id,
      createdAt: override.createdAt.toISOString(),
      updatedAt: override.updatedAt.toISOString(),
    });
  }

  return resolved.sort((a, b) => a.label.localeCompare(b.label));
}

export function sumResolvedIncomes(resolved: ResolvedIncome[]): number {
  return resolved.reduce((sum, income) => sum + income.amount, 0);
}

export function sumResolvedIncomesByTenant(
  resolved: ResolvedIncome[],
  tenantId: string,
): number {
  return resolved
    .filter((income) => income.tenantId === tenantId)
    .reduce((sum, income) => sum + income.amount, 0);
}

export function sumResolvedIncomesForMonth(
  templates: PrismaIncomeTemplate[],
  overrides: PrismaIncome[],
  month: string,
): number {
  return sumResolvedIncomes(resolveIncomesForMonth(templates, overrides, month));
}

/** @deprecated Use resolveIncomesForMonth for template-aware totals */
export function sumIncomesForMonth(incomes: PrismaIncome[], month: string): number {
  return incomes
    .filter((income) => income.month === month)
    .reduce((sum, income) => sum + decimalToNumber(income.amount), 0);
}

/** @deprecated Use sumResolvedIncomesByTenant */
export function sumIncomesByTenantForMonth(
  incomes: PrismaIncome[],
  month: string,
  tenantId: string,
): number {
  return incomes
    .filter((income) => income.month === month && income.tenantId === tenantId)
    .reduce((sum, income) => sum + decimalToNumber(income.amount), 0);
}
