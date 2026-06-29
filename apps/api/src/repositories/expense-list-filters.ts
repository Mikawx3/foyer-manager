import type { Prisma } from "@prisma/client";
import { numberToDecimal } from "../lib/decimal.js";

export interface ExpenseListFilterInput {
  householdId: string;
  categoryId?: string;
  month?: string;
  search?: string;
}

export function monthToDateRange(month: string): { gte: Date; lt: Date } {
  const [yearStr, monthStr] = month.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  const gte = new Date(year, monthIndex, 1);
  const lt = new Date(year, monthIndex + 1, 1);
  return { gte, lt };
}

export function buildExpenseListWhere(
  filters: ExpenseListFilterInput,
): Prisma.ExpenseWhereInput {
  const conditions: Prisma.ExpenseWhereInput[] = [{ householdId: filters.householdId }];

  if (filters.categoryId) {
    conditions.push({ categoryId: filters.categoryId });
  }

  if (filters.month) {
    const { gte, lt } = monthToDateRange(filters.month);
    conditions.push({ date: { gte, lt } });
  }

  const search = filters.search?.trim();
  if (search) {
    const orConditions: Prisma.ExpenseWhereInput[] = [
      { description: { contains: search, mode: "insensitive" } },
      { paidByTenant: { name: { contains: search, mode: "insensitive" } } },
    ];
    const normalizedAmount = search.replace(",", ".");
    const parsedAmount = Number(normalizedAmount);
    if (Number.isFinite(parsedAmount) && parsedAmount > 0) {
      orConditions.push({ amount: { equals: numberToDecimal(parsedAmount) } });
    }
    conditions.push({ OR: orConditions });
  }

  if (conditions.length === 1) {
    return conditions[0] ?? { householdId: filters.householdId };
  }

  return { AND: conditions };
}
