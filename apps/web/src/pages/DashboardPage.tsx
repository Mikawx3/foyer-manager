import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "../components/dashboard/ChartCard.tsx";
import { ChartSkeleton } from "../components/dashboard/ChartSkeleton.tsx";
import { KpiCard } from "../components/dashboard/KpiCard.tsx";
import { KpiGridSkeleton } from "../components/dashboard/KpiGridSkeleton.tsx";
import { ErrorMessage } from "../components/ui/ErrorMessage.tsx";
import {
  getApiErrorMessage,
  getBalances,
  getCategories,
  getExpenses,
  getTenants,
} from "../lib/api.ts";
import {
  computeBalanceChartData,
  computeCategorySpending,
  computeDashboardKpis,
  computeMonthlyTrend,
  filterExpensesThisMonth,
} from "../lib/dashboard-stats.ts";
import { formatCurrency } from "../lib/format.ts";
import { queryKeys } from "../lib/query-keys.ts";
import { amount, pageSubtitle, pageTitle } from "../lib/ui-classes.ts";

const CHART_HEIGHT = 280;
const PRIMARY_STROKE = "#6d28d9";
const AXIS_TICK = { fill: "#78716c", fontSize: 12 };
const GRID_STROKE = "oklch(0.2 0.01 80 / 0.08)";

function currencyTooltipFormatter(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return formatCurrency(value);
  }
  if (typeof value === "string") {
    const numeric = Number(value);
    return formatCurrency(Number.isFinite(numeric) ? numeric : 0);
  }
  return formatCurrency(0);
}

export function DashboardPage() {
  const { id: householdId = "" } = useParams<{ id: string }>();

  const expensesQuery = useQuery({
    queryKey: queryKeys.expenses(householdId),
    queryFn: () => getExpenses(householdId),
    enabled: Boolean(householdId),
  });

  const balancesQuery = useQuery({
    queryKey: queryKeys.balances(householdId),
    queryFn: () => getBalances(householdId),
    enabled: Boolean(householdId),
  });

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories(householdId),
    queryFn: () => getCategories(householdId),
    enabled: Boolean(householdId),
  });

  const tenantsQuery = useQuery({
    queryKey: queryKeys.tenants(householdId),
    queryFn: () => getTenants(householdId),
    enabled: Boolean(householdId),
  });

  const isLoading =
    expensesQuery.isLoading ||
    balancesQuery.isLoading ||
    categoriesQuery.isLoading ||
    tenantsQuery.isLoading;

  const queryError =
    expensesQuery.error ?? balancesQuery.error ?? categoriesQuery.error ?? tenantsQuery.error;

  const refetchAll = () => {
    void expensesQuery.refetch();
    void balancesQuery.refetch();
    void categoriesQuery.refetch();
    void tenantsQuery.refetch();
  };

  const stats = useMemo(() => {
    if (
      !expensesQuery.data ||
      !balancesQuery.data ||
      !categoriesQuery.data ||
      !tenantsQuery.data
    ) {
      return null;
    }

    const tenantNameById = new Map(tenantsQuery.data.map((t) => [t.id, t.name]));
    const monthExpenses = filterExpensesThisMonth(expensesQuery.data);

    return {
      kpis: computeDashboardKpis(monthExpenses, balancesQuery.data, tenantNameById),
      categorySlices: computeCategorySpending(expensesQuery.data, categoriesQuery.data),
      monthlyTrend: computeMonthlyTrend(expensesQuery.data),
      balanceBars: computeBalanceChartData(balancesQuery.data, tenantsQuery.data),
    };
  }, [expensesQuery.data, balancesQuery.data, categoriesQuery.data, tenantsQuery.data]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className={pageTitle}>Dashboard</h1>
        <p className={pageSubtitle}>Household overview</p>
      </div>

      {queryError && (
        <ErrorMessage message={getApiErrorMessage(queryError)} onRetry={refetchAll} />
      )}

      {isLoading && (
        <>
          <KpiGridSkeleton />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ChartSkeleton />
            <ChartSkeleton />
            <div className="lg:col-span-2">
              <ChartSkeleton />
            </div>
          </div>
        </>
      )}

      {!isLoading && stats && (
        <>
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard
              title="Total this month"
              value={<span className={amount}>{formatCurrency(stats.kpis.totalThisMonth)}</span>}
            />
            <KpiCard
              title="Expenses this month"
              value={stats.kpis.expenseCountThisMonth}
            />
            <KpiCard
              title="Largest expense"
              value={
                stats.kpis.largestExpense ? (
                  <span className={amount}>{formatCurrency(stats.kpis.largestExpense.amount)}</span>
                ) : (
                  "—"
                )
              }
              subtitle={stats.kpis.largestExpense?.description}
            />
            <KpiCard
              title="Most indebted"
              value={
                stats.kpis.allSettled ? (
                  "All settled"
                ) : stats.kpis.mostIndebted ? (
                  <span className={`${amount} text-negative`}>
                    {formatCurrency(stats.kpis.mostIndebted.balance)}
                  </span>
                ) : (
                  "—"
                )
              }
              subtitle={stats.kpis.mostIndebted?.name}
            />
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ChartCard
              title="Spending by category"
              isEmpty={stats.categorySlices.length === 0}
              emptyMessage="No expenses yet. Add expenses to see category breakdown."
            >
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <PieChart>
                  <Pie
                    data={stats.categorySlices}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {stats.categorySlices.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={currencyTooltipFormatter} />
                  <Legend
                    formatter={(value, entry) => {
                      const payload = entry.payload as { value?: number } | undefined;
                      const total = payload?.value ?? 0;
                      return `${String(value)} · ${formatCurrency(total)}`;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Monthly trend"
              isEmpty={stats.monthlyTrend.every((point) => point.total === 0)}
              emptyMessage="No spending in the last 6 months."
            >
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <LineChart data={stats.monthlyTrend}>
                  <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                  <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={AXIS_TICK}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value: number) => formatCurrency(value)}
                    width={72}
                  />
                  <Tooltip formatter={currencyTooltipFormatter} />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke={PRIMARY_STROKE}
                    strokeWidth={2}
                    dot={{ fill: PRIMARY_STROKE, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <div className="lg:col-span-2">
              <ChartCard
                title="Balances"
                isEmpty={stats.balanceBars.length === 0}
                emptyMessage="No members or balance data yet."
              >
                <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                  <BarChart data={stats.balanceBars}>
                    <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                    <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={AXIS_TICK}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value: number) => formatCurrency(value)}
                      width={72}
                    />
                    <Tooltip formatter={currencyTooltipFormatter} />
                    <Bar dataKey="balance" radius={[6, 6, 0, 0]}>
                      {stats.balanceBars.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
