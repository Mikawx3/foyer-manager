import type { IncomeStats } from "@foyer/types";
import { useTranslation } from "react-i18next";
import { useFormat } from "../../hooks/useFormat.ts";
import { card, amount } from "../../lib/ui-classes.ts";
import { savingsRateTone } from "../../lib/income-stats.ts";

interface MemberBreakdownTableProps {
  stats: IncomeStats;
}

function SavingsBadge({ rate }: { rate: number }) {
  const tone = savingsRateTone(rate);
  const className =
    tone === "positive"
      ? "bg-positive/10 text-positive"
      : tone === "warning"
        ? "bg-amber-100 text-amber-700"
        : "bg-negative/10 text-negative";

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {rate.toFixed(1)}%
    </span>
  );
}

export function MemberBreakdownTable({ stats }: MemberBreakdownTableProps) {
  const { t } = useTranslation("income");
  const { formatCurrency } = useFormat();

  if (stats.byTenant.length === 0) {
    return null;
  }

  return (
    <section className={card}>
      <h2 className="text-sm font-semibold text-stone-900">{t("stats.breakdown")}</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-stone-500">
              <th className="pb-2 pr-4 font-medium">{t("columns.member")}</th>
              <th className="pb-2 pr-4 font-medium">{t("columns.income")}</th>
              <th className="pb-2 pr-4 font-medium">{t("columns.expenses")}</th>
              <th className="pb-2 pr-4 font-medium">{t("columns.balance")}</th>
              <th className="pb-2 font-medium">{t("columns.savingsRate")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {stats.byTenant.map((row) => (
              <tr key={row.tenantId}>
                <td className="py-3 pr-4 font-medium text-stone-900">{row.tenantName}</td>
                <td className={`py-3 pr-4 ${amount} text-positive`}>
                  {formatCurrency(row.income)}
                </td>
                <td className={`py-3 pr-4 ${amount}`}>{formatCurrency(row.expenses)}</td>
                <td
                  className={`py-3 pr-4 ${amount} ${
                    row.balance >= 0 ? "text-positive" : "text-negative"
                  }`}
                >
                  {formatCurrency(row.balance)}
                </td>
                <td className="py-3">
                  <SavingsBadge rate={row.savingsRate} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
