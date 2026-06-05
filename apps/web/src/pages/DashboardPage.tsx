import type { Expense } from "@foyer/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  SettlementModal,
  type SettlementModalDraft,
} from "../components/balances/SettlementModal.tsx";
import { ChartCard } from "../components/dashboard/ChartCard.tsx";
import { ChartSkeleton } from "../components/dashboard/ChartSkeleton.tsx";
import { KpiCard } from "../components/dashboard/KpiCard.tsx";
import { KpiGridSkeleton } from "../components/dashboard/KpiGridSkeleton.tsx";
import { ExpenseEditModal } from "../components/expenses/ExpenseEditModal.tsx";
import { CategoryBadge } from "../components/ui/CategoryBadge.tsx";
import { ErrorMessage } from "../components/ui/ErrorMessage.tsx";
import { ListSkeleton } from "../components/ui/Skeleton.tsx";
import { useFormat } from "../hooks/useFormat.ts";
import {
  createSettlement,
  getApiErrorMessage,
  getBalances,
  getCategories,
  getExpenses,
  getHousehold,
  getTenants,
} from "../lib/api.ts";
import {
  computeBalanceChartData,
  computeCategorySpending,
  computeDashboardKpis,
  computeMonthlyTrend,
  filterExpensesThisMonth,
} from "../lib/dashboard-stats.ts";
import type { ExpenseListFilters } from "../lib/expense-list-filters.ts";
import { fetchAllExpenses } from "../lib/fetch-all-expenses.ts";
import { formatTenantName } from "../lib/format-tenant-name.ts";
import { isSoloHousehold } from "../lib/household-mode.ts";
import { queryKeys } from "../lib/query-keys.ts";
import { computeSuggestedSettlements } from "../lib/suggested-settlements.ts";
import { mutationToastHandlers } from "../lib/toast.ts";
import { amount, btnPrimary, btnSecondary, card, pageSubtitle, pageTitle } from "../lib/ui-classes.ts";

const CHART_HEIGHT = 280;
const PRIMARY_STROKE = "#6d28d9";
const AXIS_TICK = { fill: "#78716c", fontSize: 12 };
const GRID_STROKE = "oklch(0.2 0.01 80 / 0.08)";

const RECENT_FILTERS: ExpenseListFilters = { page: 1, limit: 5, month: "" };

function toDateInputValue(iso?: string): string {
  const date = iso !== undefined ? new Date(iso) : new Date();
  return date.toISOString().slice(0, 10);
}

function isoFromDateInput(value: string): string {
  return new Date(`${value}T12:00:00.000Z`).toISOString();
}

function BalanceBarLabel({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  value = 0,
  formatSignedCurrency,
}: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  value?: number;
  formatSignedCurrency: (amount: number) => string;
}) {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) {
    return null;
  }
  const label = formatSignedCurrency(num);
  const isPositive = num >= 0;
  const textX = x + width / 2;
  const textY = isPositive ? y - 6 : y + height + 14;
  return (
    <text x={textX} y={textY} textAnchor="middle" fill="#78716c" fontSize={12}>
      {label}
    </text>
  );
}

export function DashboardPage() {
  const { id: householdId = "" } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { t } = useTranslation("dashboard");
  const { t: tCommon } = useTranslation("common");
  const { t: tToast } = useTranslation("toast");
  const { locale, formatCurrency, formatDate, formatSignedCurrency } = useFormat();

  const currencyTooltipFormatter = (value: unknown): string => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return formatCurrency(value);
    }
    if (typeof value === "string") {
      const numeric = Number(value);
      return formatCurrency(Number.isFinite(numeric) ? numeric : 0);
    }
    return formatCurrency(0);
  };

  const [modalDraft, setModalDraft] = useState<SettlementModalDraft | null>(null);
  const [modalAmount, setModalAmount] = useState("");
  const [modalNote, setModalNote] = useState("");
  const [modalDate, setModalDate] = useState(toDateInputValue());
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const householdQuery = useQuery({
    queryKey: queryKeys.household(householdId),
    queryFn: () => getHousehold(householdId),
    enabled: Boolean(householdId),
  });

  const expensesQuery = useQuery({
    queryKey: queryKeys.expensesAll(householdId),
    queryFn: () => fetchAllExpenses(householdId),
    enabled: Boolean(householdId),
  });

  const recentExpensesQuery = useQuery({
    queryKey: queryKeys.expenses(householdId, RECENT_FILTERS),
    queryFn: () => getExpenses(householdId, { page: 1, limit: 5 }),
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
    tenantsQuery.isLoading ||
    householdQuery.isLoading;

  const queryError =
    expensesQuery.error ??
    balancesQuery.error ??
    categoriesQuery.error ??
    tenantsQuery.error ??
    householdQuery.error;

  const isSolo = householdQuery.data ? isSoloHousehold(householdQuery.data) : false;

  const refetchAll = () => {
    void expensesQuery.refetch();
    void recentExpensesQuery.refetch();
    void balancesQuery.refetch();
    void categoriesQuery.refetch();
    void tenantsQuery.refetch();
    void householdQuery.refetch();
  };

  const tenantNameById = useMemo(
    () => new Map(tenantsQuery.data?.map((tenant) => [tenant.id, formatTenantName(tenant)]) ?? []),
    [tenantsQuery.data],
  );

  const categoryNameById = useMemo(
    () => new Map(categoriesQuery.data?.map((category) => [category.id, category.name]) ?? []),
    [categoriesQuery.data],
  );

  const suggestions = useMemo(
    () => computeSuggestedSettlements(balancesQuery.data ?? []),
    [balancesQuery.data],
  );

  const tenants = tenantsQuery.data ?? [];

  const createSettlementMutation = useMutation({
    mutationFn: (input: {
      fromTenantId: string;
      toTenantId: string;
      amount: number;
      note?: string;
      date: string;
    }) => createSettlement(householdId, input),
    ...mutationToastHandlers({
      successMessage: tToast("settlementRecorded"),
      onSuccess: () => {
        setModalDraft(null);
        setModalAmount("");
        setModalNote("");
        void queryClient.invalidateQueries({ queryKey: ["balances", householdId] });
        void queryClient.invalidateQueries({ queryKey: queryKeys.settlements(householdId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.expensesAll(householdId) });
      },
    }),
  });

  const resetModalFields = () => {
    setModalNote("");
    setModalDate(toDateInputValue());
  };

  const openSuggestedSettlementModal = (
    fromTenantId: string,
    toTenantId: string,
    fromName: string,
    toName: string,
    settlementAmount: number,
  ) => {
    setModalDraft({
      mode: "suggested",
      fromTenantId,
      toTenantId,
      fromName,
      toName,
    });
    setModalAmount(String(settlementAmount));
    resetModalFields();
  };

  const handleFromChange = (fromTenantId: string) => {
    if (!modalDraft) {
      return;
    }
    const nextToTenantId =
      modalDraft.toTenantId === fromTenantId
        ? (tenants.find((tenant) => tenant.id !== fromTenantId)?.id ?? "")
        : modalDraft.toTenantId;
    setModalDraft({
      ...modalDraft,
      fromTenantId,
      toTenantId: nextToTenantId,
    });
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

    const monthExpenses = filterExpensesThisMonth(expensesQuery.data);

    return {
      kpis: computeDashboardKpis(monthExpenses, balancesQuery.data, tenantNameById),
      categorySlices: computeCategorySpending(
        expensesQuery.data,
        categoriesQuery.data,
        tCommon("unknown"),
      ),
      monthlyTrend: computeMonthlyTrend(expensesQuery.data, locale),
      balanceBars: computeBalanceChartData(balancesQuery.data, tenantsQuery.data),
    };
  }, [
    expensesQuery.data,
    balancesQuery.data,
    categoriesQuery.data,
    tenantsQuery.data,
    tenantNameById,
    locale,
    tCommon,
  ]);

  const categoryChartHeight = stats
    ? Math.max(CHART_HEIGHT, stats.categorySlices.length * 40 + 40)
    : CHART_HEIGHT;

  return (
    <div className="space-y-8">
      <div>
        <h1 className={pageTitle}>{t("title")}</h1>
        <p className={pageSubtitle}>{t("subtitle")}</p>
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
          <section className={`grid grid-cols-2 gap-4 ${isSolo ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}>
            <KpiCard
              title={t("totalThisMonth")}
              value={
                <span className={amount}>{formatCurrency(stats.kpis.totalThisMonth)}</span>
              }
            />
            <KpiCard
              title={t("expensesThisMonth")}
              value={stats.kpis.expenseCountThisMonth}
            />
            <KpiCard
              title={t("largestExpense")}
              value={
                stats.kpis.largestExpense ? (
                  <span className={amount}>{formatCurrency(stats.kpis.largestExpense.amount)}</span>
                ) : (
                  tCommon("dash")
                )
              }
              subtitle={stats.kpis.largestExpense?.description}
            />
            {!isSolo && (
              <KpiCard
                to={`/households/${householdId}/balances`}
                title={t("pendingSettlements")}
                value={stats.kpis.pendingSettlementCount}
                subtitle={
                  stats.kpis.mostIndebted
                    ? `${stats.kpis.mostIndebted.name} · ${formatSignedCurrency(stats.kpis.mostIndebted.balance)}`
                    : undefined
                }
              />
            )}
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ChartCard
              title={t("spendingByCategory")}
              isEmpty={stats.categorySlices.length === 0}
              emptyMessage={t("spendingByCategoryEmpty")}
            >
              <ResponsiveContainer width="100%" height={categoryChartHeight}>
                <BarChart
                  layout="vertical"
                  data={stats.categorySlices}
                  margin={{ left: 8, right: 56, top: 8, bottom: 8 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={AXIS_TICK}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip formatter={currencyTooltipFormatter} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                    {stats.categorySlices.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                    <LabelList
                      dataKey="value"
                      position="right"
                      formatter={currencyTooltipFormatter}
                      fill="#78716c"
                      fontSize={12}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title={t("monthlyTrend")}
              isEmpty={stats.monthlyTrend.every((point) => point.total === 0)}
              emptyMessage={t("monthlyTrendEmpty")}
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

            {!isSolo && (
            <div className="lg:col-span-2">
              <ChartCard
                title={t("balancesChart")}
                isEmpty={stats.balanceBars.length === 0}
                emptyMessage={t("balancesChartEmpty")}
              >
                <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
                  <div className="min-w-[280px]">
                    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                      <BarChart data={stats.balanceBars} margin={{ top: 20, bottom: 20 }}>
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
                          <LabelList
                            dataKey="balance"
                            content={
                              <BalanceBarLabel formatSignedCurrency={formatSignedCurrency} />
                            }
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </ChartCard>
            </div>
            )}
          </section>

          {!isSolo && (
          <section className={card}>
            <h2 className="text-sm font-semibold tracking-tight text-stone-900">
              {t("pendingSettlementsSection")}
            </h2>
            {suggestions.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {suggestions.map((suggestion) => {
                  const fromName =
                    tenantNameById.get(suggestion.fromTenantId) ?? suggestion.fromTenantId;
                  const toName =
                    tenantNameById.get(suggestion.toTenantId) ?? suggestion.toTenantId;
                  return (
                    <li
                      key={`${suggestion.fromTenantId}-${suggestion.toTenantId}-${suggestion.amount}`}
                      className="flex flex-col gap-2 rounded-lg border border-border bg-bg px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
                    >
                      <span className="text-sm text-stone-800">
                        {tCommon("shouldPay", {
                          fromName,
                          toName,
                          amount: formatCurrency(suggestion.amount),
                        })}
                      </span>
                      <button
                        type="button"
                        className={`${btnPrimary} w-full sm:w-auto`}
                        onClick={() =>
                          openSuggestedSettlementModal(
                            suggestion.fromTenantId,
                            suggestion.toTenantId,
                            fromName,
                            toName,
                            suggestion.amount,
                          )
                        }
                      >
                        {tCommon("markAsPaid")}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-3 py-6 text-center text-sm text-stone-600">{tCommon("allSettledUp")}</p>
            )}
            <div className="mt-4 border-t border-border pt-3">
              <Link
                to={`/households/${householdId}/balances`}
                className={btnSecondary}
              >
                {tCommon("viewAllBalances")}
              </Link>
            </div>
          </section>
          )}

          <section className={card}>
            <h2 className="text-sm font-semibold tracking-tight text-stone-900">{t("recentExpenses")}</h2>
            {recentExpensesQuery.isLoading && <ListSkeleton />}
            {recentExpensesQuery.isSuccess && recentExpensesQuery.data.data.length === 0 && (
              <p className="mt-3 py-6 text-center text-sm text-stone-500">{t("recentExpensesEmpty")}</p>
            )}
            {recentExpensesQuery.isSuccess && recentExpensesQuery.data.data.length > 0 && (
              <>
                <ul className="mt-3 space-y-2 md:hidden">
                  {recentExpensesQuery.data.data.map((expense) => {
                    const categoryName =
                      categoryNameById.get(expense.categoryId) ?? tCommon("category");
                    return (
                      <li key={expense.id}>
                        <button
                          type="button"
                          className="w-full rounded-lg border border-border bg-bg px-3 py-3 text-left transition active:bg-stone-100"
                          onClick={() => setEditingExpense(expense)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="min-w-0 flex-1 font-semibold text-stone-900">
                              {expense.description}
                            </span>
                            <span className={`${amount} shrink-0`}>
                              {formatCurrency(expense.amount)}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-stone-600">
                            <CategoryBadge name={categoryName} />
                            <span>{formatDate(expense.date)}</span>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-3 hidden overflow-x-auto md:block">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs font-medium uppercase tracking-wide text-stone-500">
                        <th className="px-3 py-2">{t("tableTitle")}</th>
                        <th className="px-3 py-2">{t("tableCategory")}</th>
                        <th className="px-3 py-2 text-right">{t("tableAmount")}</th>
                        <th className="px-3 py-2">{t("tablePaidBy")}</th>
                        <th className="px-3 py-2">{t("tableDate")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {recentExpensesQuery.data.data.map((expense) => {
                        const categoryName =
                          categoryNameById.get(expense.categoryId) ?? tCommon("category");
                        return (
                          <tr
                            key={expense.id}
                            className="cursor-pointer transition hover:bg-bg active:bg-stone-100"
                            onClick={() => setEditingExpense(expense)}
                          >
                            <td className="px-3 py-2.5 font-medium text-stone-900">
                              {expense.description}
                            </td>
                            <td className="px-3 py-2.5">
                              <CategoryBadge name={categoryName} />
                            </td>
                            <td className={`px-3 py-2.5 text-right ${amount}`}>
                              {formatCurrency(expense.amount)}
                            </td>
                            <td className="px-3 py-2.5 text-stone-600">
                              {tenantNameById.get(expense.paidByTenantId) ?? tCommon("dash")}
                            </td>
                            <td className="px-3 py-2.5 text-stone-600">
                              {formatDate(expense.date)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            <div className="mt-4 border-t border-border pt-3">
              <Link
                to={`/households/${householdId}/expenses`}
                className={btnSecondary}
              >
                {tCommon("viewAllExpenses")}
              </Link>
            </div>
          </section>
        </>
      )}

      <SettlementModal
        isOpen={modalDraft !== null}
        draft={modalDraft}
        tenants={tenants.map((tenant) => ({ id: tenant.id, name: tenant.name }))}
        amount={modalAmount}
        note={modalNote}
        date={modalDate}
        onFromChange={handleFromChange}
        onToChange={(toTenantId) => {
          if (modalDraft) {
            setModalDraft({ ...modalDraft, toTenantId });
          }
        }}
        onAmountChange={setModalAmount}
        onNoteChange={setModalNote}
        onDateChange={setModalDate}
        onConfirm={() => {
          if (!modalDraft) {
            return;
          }
          const parsedAmount = Number(modalAmount);
          if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            return;
          }
          createSettlementMutation.mutate({
            fromTenantId: modalDraft.fromTenantId,
            toTenantId: modalDraft.toTenantId,
            amount: parsedAmount,
            ...(modalNote.trim() !== "" && { note: modalNote.trim() }),
            date: isoFromDateInput(modalDate),
          });
        }}
        onCancel={() => setModalDraft(null)}
        isLoading={createSettlementMutation.isPending}
      />

      {editingExpense && categoriesQuery.data && tenantsQuery.data && (
        <ExpenseEditModal
          expense={editingExpense}
          householdId={householdId}
          categories={categoriesQuery.data}
          tenants={tenantsQuery.data}
          isSolo={isSolo}
          expenseFilters={RECENT_FILTERS}
          open
          onClose={() => setEditingExpense(null)}
        />
      )}
    </div>
  );
}
