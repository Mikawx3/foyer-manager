import type { IncomeStats } from "@foyer/types";
import { useTranslation } from "react-i18next";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "../dashboard/ChartCard.tsx";
import { useFormat } from "../../hooks/useFormat.ts";
import { formatMonthLabel } from "../../lib/income-stats.ts";

const CHART_HEIGHT = 280;
const AXIS_TICK = { fill: "#78716c", fontSize: 12 };

interface IncomeTrendChartProps {
  stats: IncomeStats;
}

export function IncomeTrendChart({ stats }: IncomeTrendChartProps) {
  const { t } = useTranslation("income");
  const { formatCurrency, locale } = useFormat();

  const currencyTooltipFormatter = (value: unknown): string => {
    if (typeof value === "number") {
      return formatCurrency(value);
    }
    return String(value ?? "");
  };

  const data = stats.trend.map((point) => ({
    ...point,
    label: formatMonthLabel(point.month, locale).slice(0, 3),
  }));

  const isEmpty = data.every(
    (point) => point.income === 0 && point.expenses === 0 && point.savings === 0,
  );

  return (
    <ChartCard title={t("stats.trend")} isEmpty={isEmpty} emptyMessage={t("noIncome")}>
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e7e5e4" />
          <XAxis dataKey="label" tick={AXIS_TICK} />
          <YAxis hide />
          <Tooltip formatter={currencyTooltipFormatter} />
          <Legend />
          <Line
            type="monotone"
            dataKey="income"
            name={t("income")}
            stroke="var(--color-positive)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="expenses"
            name={t("expenses")}
            stroke="var(--color-negative)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="savings"
            name={t("savings")}
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
