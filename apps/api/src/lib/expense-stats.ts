import type { Category } from "@prisma/client";
import type { CategoryExpenseStat } from "@foyer/types";
import { round2 } from "./decimal.js";

export interface CategoryGroupRow {
  categoryId: string;
  amount: number;
  expenseCount: number;
}

export function buildCategoryExpenseStats(
  groups: CategoryGroupRow[],
  categories: Category[],
  totalExpenses: number,
): CategoryExpenseStat[] {
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  return groups
    .map((row) => {
      const category = categoryById.get(row.categoryId);
      const sharePercent =
        totalExpenses > 0 ? round2((row.amount / totalExpenses) * 100) : 0;
      return {
        categoryId: row.categoryId,
        categorySlug: category?.slug ?? category?.name ?? "unknown",
        amount: row.amount,
        sharePercent,
        expenseCount: row.expenseCount,
      };
    })
    .sort((a, b) => b.amount - a.amount);
}
