import type { Prisma } from "@prisma/client";

export interface ExpenseListFilterInput {
  householdId: string;
  categoryId?: string;
  month?: string;
}

export function buildExpenseListWhere(
  filters: ExpenseListFilterInput,
): Prisma.ExpenseWhereInput {
  const where: Prisma.ExpenseWhereInput = {
    householdId: filters.householdId,
  };

  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }

  if (filters.month) {
    const [yearStr, monthStr] = filters.month.split("-");
    const year = Number(yearStr);
    const monthIndex = Number(monthStr) - 1;
    const gte = new Date(year, monthIndex, 1);
    const lt = new Date(year, monthIndex + 1, 1);
    where.date = { gte, lt };
  }

  return where;
}
