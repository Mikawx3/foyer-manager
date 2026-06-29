import type { Category, CategoryExpenseStat } from "@foyer/types";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useFormat } from "../../hooks/useFormat.ts";
import { toCategoryChartSlices } from "../../lib/category-stats.ts";
import { CategoryBadge } from "../ui/CategoryBadge.tsx";

interface CategoryBreakdownTableProps {
  householdId: string;
  month: string;
  byCategory: CategoryExpenseStat[];
  categories: Category[];
  getCategoryLabel: (category: Category) => string;
}

export function CategoryBreakdownTable({
  householdId,
  month,
  byCategory,
  categories,
  getCategoryLabel,
}: CategoryBreakdownTableProps) {
  const { t } = useTranslation("stats");
  const { t: tCommon } = useTranslation("common");
  const { formatCurrency } = useFormat();

  const rows = toCategoryChartSlices(
    byCategory,
    categories,
    getCategoryLabel,
    tCommon("unknown"),
  );

  if (rows.length === 0) {
    return null;
  }

  const categoryById = new Map(categories.map((category) => [category.id, category]));

  return (
    <div className="hidden overflow-x-auto rounded-xl border border-border bg-surface shadow-sm lg:block">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-stone-500">
            <th className="px-4 py-3">{t("category")}</th>
            <th className="px-4 py-3 text-right">{t("amount")}</th>
            <th className="px-4 py-3 text-right">{t("share")}</th>
            <th className="px-4 py-3 text-right">{t("expenseCountColumn")}</th>
            <th className="px-4 py-3 text-right">{tCommon("actions")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const category = categoryById.get(row.categoryId);
            return (
              <tr key={row.categoryId} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3">
                  {category ? (
                    <CategoryBadge name={category.name} slug={category.slug} color={category.color} />
                  ) : (
                    <span className="text-stone-700">{row.name}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-stone-900">
                  {formatCurrency(row.value)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-stone-600">
                  {row.sharePercent.toFixed(1)}%
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-stone-600">
                  {row.expenseCount}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    to={`/households/${householdId}/expenses?month=${month}&categoryId=${row.categoryId}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {t("view")}
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
