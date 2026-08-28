import type { IncomeStats, Tenant } from "@foyer/types";
import { useTranslation } from "react-i18next";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "../dashboard/ChartCard.tsx";
import { useFormat } from "../../hooks/useFormat.ts";
import { DEFAULT_TENANT_COLOR } from "../../lib/tenant-colors.ts";

const CHART_HEIGHT = 280;
const AXIS_TICK = { fill: "#78716c", fontSize: 12 };
const GRID_STROKE = "#e7e5e4";

interface BudgetVsExpensesChartProps {
  stats: IncomeStats;
  tenants: Tenant[];
  focusTenantId?: string;
}

export function BudgetVsExpensesChart({
  stats,
  tenants,
  focusTenantId,
}: BudgetVsExpensesChartProps) {
  const { t } = useTranslation("income");
  const { formatCurrency } = useFormat();

  const tenantColorById = new Map(
    tenants.map((tenant) => [tenant.id, tenant.color ?? DEFAULT_TENANT_COLOR]),
  );

  const data = stats.byTenant.map((row) => ({
    name: row.tenantName,
    income: row.income,
    expenses: row.expenses,
    color: tenantColorById.get(row.tenantId) ?? DEFAULT_TENANT_COLOR,
    tenantId: row.tenantId,
    focused: focusTenantId === row.tenantId,
  }));

  const isEmpty = data.every((row) => row.income === 0 && row.expenses === 0);

  const currencyTooltipFormatter = (value: unknown): string => {
    if (typeof value === "number") {
      return formatCurrency(value);
    }
    return String(value ?? "");
  };

  return (
    <ChartCard
      title={t("stats.budgetVsExpenses")}
      isEmpty={isEmpty}
      emptyMessage={t("noIncome")}
    >
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis
            dataKey="name"
            tick={(props) => {
              const { x, y, payload } = props;
              const entry = data.find((row) => row.name === payload.value);
              const isFocused = entry?.focused ?? false;
              return (
                <text
                  x={x}
                  y={y}
                  dy={16}
                  textAnchor="middle"
                  fill={isFocused ? "#1c1917" : "#78716c"}
                  fontSize={12}
                  fontWeight={isFocused ? 600 : 400}
                >
                  {payload.value}
                </text>
              );
            }}
          />
          <YAxis tick={AXIS_TICK} tickFormatter={(v: number) => formatCurrency(v)} width={72} />
          <Tooltip formatter={currencyTooltipFormatter} labelFormatter={(label) => String(label)} />
          <Legend />
          <Bar dataKey="income" name={t("income")} fill="var(--color-positive)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expenses" name={t("expenses")} fill="var(--color-negative)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
