import type { CategoryExpenseStat, ExpenseStats } from "@foyer/types";
import { useTranslation } from "react-i18next";
import { KpiCard } from "../dashboard/KpiCard.tsx";
import { useFormat } from "../../hooks/useFormat.ts";

interface ExpenseStatsKpisProps {
  stats: Pick<
    ExpenseStats,
    "totalExpenses" | "expenseCount" | "largestExpense"
  >;
  topCategory?: CategoryExpenseStat | null;
  getTopCategoryLabel?: (categoryId: string) => string;
  showLargestExpense?: boolean;
}

export function ExpenseStatsKpis({
  stats,
  topCategory = null,
  getTopCategoryLabel,
  showLargestExpense = false,
}: ExpenseStatsKpisProps) {
  const { t } = useTranslation("stats");
  const { t: tCommon } = useTranslation("common");
  const { formatCurrency } = useFormat();

  const topLabel =
    topCategory && getTopCategoryLabel
      ? getTopCategoryLabel(topCategory.categoryId)
      : undefined;

  return (
    <section className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-2 md:gap-3 md:overflow-visible md:px-0 lg:grid-cols-3">
      <div className="min-w-[148px] shrink-0 md:min-w-0">
        <KpiCard
          title={t("totalExpenses")}
          value={formatCurrency(stats.totalExpenses)}
        />
      </div>
      <div className="min-w-[148px] shrink-0 md:min-w-0">
        <KpiCard title={t("expenseCount")} value={stats.expenseCount} />
      </div>
      <div className="min-w-[148px] shrink-0 md:min-w-0">
        <KpiCard
          title={t("topCategory")}
          value={topCategory ? formatCurrency(topCategory.amount) : tCommon("dash")}
          subtitle={
            topCategory
              ? `${topLabel ?? topCategory.categorySlug} · ${topCategory.sharePercent.toFixed(1)}%`
              : undefined
          }
        />
      </div>
      {showLargestExpense && (
        <div className="min-w-[148px] shrink-0 md:min-w-0">
          <KpiCard
            title={t("largestExpense")}
            value={
              stats.largestExpense
                ? formatCurrency(stats.largestExpense.amount)
                : tCommon("dash")
            }
            subtitle={stats.largestExpense?.description}
          />
        </div>
      )}
    </section>
  );
}
