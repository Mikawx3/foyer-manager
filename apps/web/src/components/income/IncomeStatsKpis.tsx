import type { IncomeStats } from "@foyer/types";
import { useTranslation } from "react-i18next";
import { KpiCard } from "../dashboard/KpiCard.tsx";
import { useFormat } from "../../hooks/useFormat.ts";
import { savingsRateTone } from "../../lib/income-stats.ts";

interface IncomeStatsKpisProps {
  stats: IncomeStats;
}

export function IncomeStatsKpis({ stats }: IncomeStatsKpisProps) {
  const { t } = useTranslation("income");
  const { formatCurrency } = useFormat();

  const savingsTone = savingsRateTone(stats.savingsRate);
  const savingsClass =
    savingsTone === "positive"
      ? "text-positive"
      : savingsTone === "warning"
        ? "text-amber-600"
        : "text-negative";

  const remainingClass = stats.remainingBudget >= 0 ? "text-positive" : "text-negative";

  return (
    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-2 md:gap-3 md:overflow-visible md:px-0 lg:grid-cols-3">
      <div className="min-w-[148px] shrink-0 md:min-w-0">
        <KpiCard
          title={t("stats.totalIncome")}
          value={formatCurrency(stats.totalIncome)}
          valueClassName="text-positive"
        />
      </div>
      <div className="min-w-[148px] shrink-0 md:min-w-0">
        <KpiCard
          title={t("stats.totalExpenses")}
          value={formatCurrency(stats.totalExpenses)}
        />
      </div>
      <div className="min-w-[148px] shrink-0 md:min-w-0">
        <KpiCard
          title={t("stats.remaining")}
          value={formatCurrency(stats.remainingBudget)}
          valueClassName={remainingClass}
        />
      </div>
      <div className="min-w-[148px] shrink-0 md:min-w-0">
        <KpiCard
          title={t("stats.savingsRate")}
          value={`${stats.savingsRate.toFixed(1)}%`}
          valueClassName={savingsClass}
        />
      </div>
      <div className="min-w-[148px] shrink-0 md:min-w-0">
        <KpiCard
          title={t("stats.largestExpense")}
          value={stats.largestExpense ? formatCurrency(stats.largestExpense.amount) : "—"}
          subtitle={stats.largestExpense?.description}
        />
      </div>
    </div>
  );
}
