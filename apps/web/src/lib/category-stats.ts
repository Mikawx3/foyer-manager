import type { Category, CategoryExpenseStat } from "@foyer/types";
import { getCategoryHexForCategory } from "./category-colors.ts";

export interface CategoryChartSlice {
  categoryId: string;
  name: string;
  value: number;
  sharePercent: number;
  expenseCount: number;
  fill: string;
}

export function toCategoryChartSlices(
  byCategory: CategoryExpenseStat[],
  categories: Category[],
  getCategoryLabel: (category: Category) => string,
  unknownLabel: string,
): CategoryChartSlice[] {
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  return byCategory.map((row) => {
    const category = categoryById.get(row.categoryId);
    const name = category ? getCategoryLabel(category) : unknownLabel;
    return {
      categoryId: row.categoryId,
      name,
      value: row.amount,
      sharePercent: row.sharePercent,
      expenseCount: row.expenseCount,
      fill: getCategoryHexForCategory(
        category?.name ?? row.categorySlug,
        category?.slug,
        category?.color,
      ),
    };
  });
}

export function monthToReferenceDate(month: string): Date {
  const [yearStr, monthStr] = month.split("-");
  return new Date(Number(yearStr), Number(monthStr) - 1, 1);
}
