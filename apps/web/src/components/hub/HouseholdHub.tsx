import type { Category } from "@foyer/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate } from "react-router-dom";
import { ExpenseForm } from "../forms/ExpenseForm.tsx";
import { EmptyState } from "../ui/EmptyState.tsx";
import { ErrorMessage } from "../ui/ErrorMessage.tsx";
import { Modal } from "../ui/Modal.tsx";
import { ListSkeleton } from "../ui/Skeleton.tsx";
import { useFormat } from "../../hooks/useFormat.ts";
import { getActiveTenants } from "../../lib/active-tenants.ts";
import {
  createCategory,
  createExpense,
  getApiErrorMessage,
  getBalances,
  getCategories,
  getExpenseStats,
  getExpenses,
  getHousehold,
  getTenants,
} from "../../lib/api.ts";
import {
  currentMonthValue,
  type ExpenseListFilters,
} from "../../lib/expense-list-filters.ts";
import { formatTenantName } from "../../lib/format-tenant-name.ts";
import { resolveHubStatus } from "../../lib/hub-status.ts";
import { isSoloHousehold } from "../../lib/household-mode.ts";
import { formatMonthLabel } from "../../lib/income-stats.ts";
import { queryKeys } from "../../lib/query-keys.ts";
import type { CreateExpenseForm, UpdateExpenseForm } from "../../lib/schemas.ts";
import { computeSuggestedSettlements } from "../../lib/suggested-settlements.ts";
import { DEFAULT_TENANT_COLOR } from "../../lib/tenant-colors.ts";
import { mutationToastHandlers } from "../../lib/toast.ts";
import {
  amount,
  btnPrimary,
  btnSecondary,
  card,
  kpiCardInteractive,
  pageActionsRow,
  pageSubtitle,
  pageTitle,
} from "../../lib/ui-classes.ts";

const recentExpenseFilters: ExpenseListFilters = {
  page: 1,
  limit: 3,
  month: "",
};

interface HouseholdHubProps {
  householdId: string;
}

export function HouseholdHub({ householdId }: HouseholdHubProps) {
  const queryClient = useQueryClient();
  const { t } = useTranslation("households");
  const { t: tCommon } = useTranslation("common");
  const { t: tExpenses } = useTranslation("expenses");
  const { t: tToast } = useTranslation("toast");
  const { locale, formatCurrency, formatDate } = useFormat();
  const [modalOpen, setModalOpen] = useState(false);
  const month = currentMonthValue();

  const householdQuery = useQuery({
    queryKey: queryKeys.household(householdId),
    queryFn: () => getHousehold(householdId),
  });

  const tenantsQuery = useQuery({
    queryKey: queryKeys.tenants(householdId),
    queryFn: () => getTenants(householdId, { includeArchived: true }),
  });

  const balancesQuery = useQuery({
    queryKey: queryKeys.balances(householdId, "all"),
    queryFn: () => getBalances(householdId, "all"),
  });

  const expenseStatsQuery = useQuery({
    queryKey: queryKeys.expenseStats(householdId, month),
    queryFn: () => getExpenseStats(householdId, month),
  });

  const recentExpensesQuery = useQuery({
    queryKey: queryKeys.expenses(householdId, recentExpenseFilters),
    queryFn: () => getExpenses(householdId, recentExpenseFilters),
  });

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories(householdId),
    queryFn: () => getCategories(householdId),
  });

  const createCategoryMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: (created) => {
      queryClient.setQueryData<Category[]>(queryKeys.categories(householdId), (current) => {
        if (!current) {
          return [created];
        }
        if (current.some((category) => category.id === created.id)) {
          return current;
        }
        return [...current, created];
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.categories(householdId) });
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: createExpense,
    ...mutationToastHandlers({
      successMessage: tToast("expenseRecorded"),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ["expenses", householdId] });
        void queryClient.invalidateQueries({ queryKey: ["expense-stats", householdId] });
        void queryClient.invalidateQueries({ queryKey: queryKeys.balances(householdId) });
        setModalOpen(false);
      },
    }),
  });

  const tenantNameById = useMemo(
    () => new Map(tenantsQuery.data?.map((tenant) => [tenant.id, formatTenantName(tenant)]) ?? []),
    [tenantsQuery.data],
  );

  const suggestions = useMemo(
    () => computeSuggestedSettlements(balancesQuery.data ?? []),
    [balancesQuery.data],
  );

  const isLoading =
    householdQuery.isLoading ||
    tenantsQuery.isLoading ||
    balancesQuery.isLoading ||
    expenseStatsQuery.isLoading ||
    recentExpensesQuery.isLoading ||
    categoriesQuery.isLoading;

  const queryError =
    householdQuery.error ??
    tenantsQuery.error ??
    balancesQuery.error ??
    expenseStatsQuery.error ??
    recentExpensesQuery.error ??
    categoriesQuery.error;

  const refetchAll = () => {
    void householdQuery.refetch();
    void tenantsQuery.refetch();
    void balancesQuery.refetch();
    void expenseStatsQuery.refetch();
    void recentExpensesQuery.refetch();
    void categoriesQuery.refetch();
  };

  if (tenantsQuery.isSuccess && getActiveTenants(tenantsQuery.data).length === 0) {
    return <Navigate to={`/households/${householdId}/onboarding`} replace />;
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <ListSkeleton rows={4} />
      </div>
    );
  }

  if (queryError || !householdQuery.data || !expenseStatsQuery.data) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <ErrorMessage message={getApiErrorMessage(queryError)} onRetry={refetchAll} />
      </div>
    );
  }

  const household = householdQuery.data;
  const isSolo = isSoloHousehold(household);
  const activeTenants = getActiveTenants(tenantsQuery.data ?? []);
  const status = resolveHubStatus({
    isSolo,
    expenseCount: expenseStatsQuery.data.expenseCount,
    suggestions,
    nameOf: (tenantId) => tenantNameById.get(tenantId) ?? tenantId,
  });
  const recentExpenses = recentExpensesQuery.data?.data ?? [];
  const monthLabel = formatMonthLabel(month, locale);

  const statusText =
    status.kind === "owes"
      ? t("owes", {
          fromName: status.fromName,
          toName: status.toName,
          amount: formatCurrency(status.amount),
        })
      : status.kind === "settled"
        ? t("allSettled")
        : status.kind === "solo-empty"
          ? t("soloMonthEmpty")
          : t("soloMonthCount", { count: status.expenseCount });

  const handleCreateExpense = async (data: CreateExpenseForm | UpdateExpenseForm) => {
    if ("householdId" in data) {
      await createExpenseMutation.mutateAsync(data);
    }
  };

  const handleCreateCategory = (input: { name: string }) =>
    createCategoryMutation.mutateAsync({
      name: input.name,
      householdId,
    });

  const openExpenseModal = () => setModalOpen(true);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className={pageActionsRow}>
        <div>
          <h1 className={pageTitle}>{household.name}</h1>
          <p className={pageSubtitle}>
            {tCommon("householdType", { type: tCommon(household.type) })}
          </p>
          {activeTenants.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {activeTenants.map((tenant) => (
                <li
                  key={tenant.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 text-sm text-stone-800"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: tenant.color ?? DEFAULT_TENANT_COLOR }}
                    aria-hidden
                  />
                  {tenant.name}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          className={`${btnPrimary} inline-flex items-center gap-2`}
          onClick={openExpenseModal}
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          {tExpenses("newExpense")}
        </button>
      </div>

      <section className={card}>
        <p className="text-lg font-semibold text-stone-900 md:text-xl">{statusText}</p>
        {status.kind === "owes" && (
          <Link
            to={`/households/${householdId}/balances`}
            className={`${btnSecondary} mt-3`}
          >
            {t("viewBalances")}
          </Link>
        )}
      </section>

      <Link
        to={`/households/${householdId}/dashboard`}
        className={kpiCardInteractive}
        aria-label={`${t("monthTotal")} ${monthLabel}`}
      >
        <p className="text-sm text-stone-600">{t("monthTotal")}</p>
        <p className="mt-1 text-sm text-stone-500">{monthLabel}</p>
        <p className={`${amount} mt-2 text-2xl`}>
          {formatCurrency(expenseStatsQuery.data.totalExpenses)}
        </p>
      </Link>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-stone-800">{t("recentExpenses")}</h2>
          {recentExpenses.length > 0 && (
            <Link
              to={`/households/${householdId}/expenses`}
              className={btnSecondary}
            >
              {tCommon("viewAllExpenses")}
            </Link>
          )}
        </div>
        {recentExpenses.length === 0 ? (
          <EmptyState
            title={t("recentEmptyTitle")}
            description={t("recentEmptyDescription")}
            action={
              <button
                type="button"
                className={`${btnPrimary} inline-flex items-center gap-2`}
                onClick={openExpenseModal}
              >
                <Plus className="h-4 w-4" strokeWidth={2} />
                {tExpenses("newExpense")}
              </button>
            }
          />
        ) : (
          <ul className={`${card} divide-y divide-border`}>
            {recentExpenses.map((expense) => {
              const paidByName =
                tenantNameById.get(expense.paidByTenantId) ?? tCommon("dash");
              return (
                <li key={expense.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="font-medium text-stone-900">{expense.description}</p>
                    <p className="mt-0.5 text-sm text-stone-500">
                      {tCommon("paidByPrefix", { name: paidByName })} · {formatDate(expense.date)}
                    </p>
                  </div>
                  <span className={`${amount} shrink-0`}>{formatCurrency(expense.amount)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {categoriesQuery.isSuccess && (
        <Modal
          title={tExpenses("newExpense")}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          fullHeightMobile
          size="xl"
        >
          <ExpenseForm
            layout="dialog"
            showHeading={false}
            householdId={householdId}
            categories={categoriesQuery.data}
            tenants={activeTenants}
            isSolo={isSolo}
            onSubmit={handleCreateExpense}
            onCreateCategory={handleCreateCategory}
            isPending={createExpenseMutation.isPending || createCategoryMutation.isPending}
          />
        </Modal>
      )}
    </div>
  );
}
