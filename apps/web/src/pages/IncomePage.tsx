import type { IncomeTemplate, ResolvedIncome } from "@foyer/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { BudgetVsExpensesChart } from "../components/income/BudgetVsExpensesChart.tsx";
import {
  IncomeFormModal,
  type IncomeFormMode,
} from "../components/income/IncomeFormModal.tsx";
import { IncomeMemberCards } from "../components/income/IncomeMemberCards.tsx";
import { IncomeStatsKpis } from "../components/income/IncomeStatsKpis.tsx";
import { IncomeTrendChart } from "../components/income/IncomeTrendChart.tsx";
import { MemberBreakdownTable } from "../components/income/MemberBreakdownTable.tsx";
import { MonthNavigator } from "../components/income/MonthNavigator.tsx";
import { RecurringIncomeSection } from "../components/income/RecurringIncomeSection.tsx";
import { TenantIncomeListModal } from "../components/income/TenantIncomeListModal.tsx";
import { KpiGridSkeleton } from "../components/dashboard/KpiGridSkeleton.tsx";
import { ChartSkeleton } from "../components/dashboard/ChartSkeleton.tsx";
import { ConfirmModal } from "../components/ui/ConfirmModal.tsx";
import { ErrorMessage } from "../components/ui/ErrorMessage.tsx";
import { ListSkeleton } from "../components/ui/Skeleton.tsx";
import {
  deleteIncome,
  deleteIncomeTemplate,
  getApiErrorMessage,
  getHousehold,
  getIncomeStats,
  getTenants,
  listIncomeTemplates,
  listIncomes,
} from "../lib/api.ts";
import { aggregateIncomeByTenant } from "../lib/income-stats.ts";
import { computeDashboardKpis, filterExpensesThisMonth } from "../lib/dashboard-stats.ts";
import { currentMonthValue } from "../lib/expense-list-filters.ts";
import { fetchAllExpenses } from "../lib/fetch-all-expenses.ts";
import { queryKeys } from "../lib/query-keys.ts";
import { mutationToastHandlers } from "../lib/toast.ts";
import { fabBottomOffset, fabButton, pageSubtitle, pageTitle } from "../lib/ui-classes.ts";

export function IncomePage() {
  const { t } = useTranslation("income");
  const { t: tCommon } = useTranslation("common");
  const { t: tToast } = useTranslation("toast");
  const queryClient = useQueryClient();
  const { id: householdId = "" } = useParams<{ id: string }>();
  const [month, setMonth] = useState(currentMonthValue);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<IncomeFormMode>("create-month");
  const [editingResolved, setEditingResolved] = useState<ResolvedIncome | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<IncomeTemplate | null>(null);
  const [formTenantId, setFormTenantId] = useState<string | undefined>();
  const [listTenantId, setListTenantId] = useState<string | null>(null);
  const [deleteTemplateTarget, setDeleteTemplateTarget] = useState<IncomeTemplate | null>(null);

  const householdQuery = useQuery({
    queryKey: queryKeys.household(householdId),
    queryFn: () => getHousehold(householdId),
    enabled: Boolean(householdId),
  });

  const tenantsQuery = useQuery({
    queryKey: queryKeys.tenants(householdId),
    queryFn: () => getTenants(householdId),
    enabled: Boolean(householdId),
  });

  const templatesQuery = useQuery({
    queryKey: queryKeys.incomeTemplates(householdId),
    queryFn: () => listIncomeTemplates(householdId),
    enabled: Boolean(householdId),
  });

  const incomesQuery = useQuery({
    queryKey: queryKeys.incomes(householdId, month),
    queryFn: () => listIncomes(householdId, month),
    enabled: Boolean(householdId),
  });

  const statsQuery = useQuery({
    queryKey: queryKeys.incomeStats(householdId, month),
    queryFn: () => getIncomeStats(householdId, month),
    enabled: Boolean(householdId),
  });

  const expensesQuery = useQuery({
    queryKey: queryKeys.expensesAll(householdId),
    queryFn: () => fetchAllExpenses(householdId),
    enabled: Boolean(householdId),
  });

  const resetOverrideMutation = useMutation({
    mutationFn: (overrideId: string) => deleteIncome(householdId, overrideId),
    ...mutationToastHandlers({
      successMessage: tToast("incomeOverrideReset"),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ["incomes", householdId] });
        void queryClient.invalidateQueries({ queryKey: ["income-stats", householdId] });
      },
    }),
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (templateId: string) => deleteIncomeTemplate(householdId, templateId),
    ...mutationToastHandlers({
      successMessage: tToast("incomeTemplateDeleted"),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ["income-templates", householdId] });
        void queryClient.invalidateQueries({ queryKey: ["incomes", householdId] });
        void queryClient.invalidateQueries({ queryKey: ["income-stats", householdId] });
        setDeleteTemplateTarget(null);
      },
    }),
  });

  const tenants = useMemo(
    () => (tenantsQuery.data ?? []).filter((tenant) => tenant.active),
    [tenantsQuery.data],
  );

  const incomeByTenant = useMemo(
    () => aggregateIncomeByTenant(incomesQuery.data ?? []),
    [incomesQuery.data],
  );

  const largestExpense = useMemo(() => {
    const expenses = expensesQuery.data ?? [];
    const monthDate = new Date(
      Number(month.split("-")[0]),
      Number(month.split("-")[1]) - 1,
      1,
    );
    const monthExpenses = filterExpensesThisMonth(expenses, monthDate);
    const kpis = computeDashboardKpis(monthExpenses, [], new Map());
    return kpis.largestExpense;
  }, [expensesQuery.data, month]);

  const listTenant = tenants.find((tenant) => tenant.id === listTenantId) ?? null;

  const isLoading =
    householdQuery.isLoading ||
    tenantsQuery.isLoading ||
    templatesQuery.isLoading ||
    incomesQuery.isLoading ||
    statsQuery.isLoading;

  const queryError =
    householdQuery.error ??
    tenantsQuery.error ??
    templatesQuery.error ??
    incomesQuery.error ??
    statsQuery.error ??
    expensesQuery.error;

  const refetchAll = () => {
    void householdQuery.refetch();
    void tenantsQuery.refetch();
    void templatesQuery.refetch();
    void incomesQuery.refetch();
    void statsQuery.refetch();
    void expensesQuery.refetch();
  };

  const openCreateMonth = (tenantId?: string) => {
    setFormMode("create-month");
    setEditingResolved(null);
    setEditingTemplate(null);
    setFormTenantId(tenantId);
    setListTenantId(null);
    setFormOpen(true);
  };

  const openCreateRecurring = (tenantId?: string) => {
    setFormMode("create-recurring");
    setEditingResolved(null);
    setEditingTemplate(null);
    setFormTenantId(tenantId);
    setFormOpen(true);
  };

  const openEditResolved = (income: ResolvedIncome) => {
    setFormMode("edit-resolved");
    setEditingResolved(income);
    setEditingTemplate(null);
    setListTenantId(null);
    setFormOpen(true);
  };

  const openEditTemplate = (template: IncomeTemplate) => {
    setFormMode("edit-template");
    setEditingTemplate(template);
    setEditingResolved(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingResolved(null);
    setEditingTemplate(null);
    setFormTenantId(undefined);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className={pageTitle}>{t("title")}</h1>
        <p className={pageSubtitle}>{t("subtitle")}</p>
      </header>

      <MonthNavigator month={month} onChange={setMonth} />

      {queryError && (
        <ErrorMessage message={getApiErrorMessage(queryError)} onRetry={refetchAll} />
      )}

      {isLoading && (
        <>
          <ListSkeleton rows={2} />
          <KpiGridSkeleton />
          <ChartSkeleton />
        </>
      )}

      {!isLoading && statsQuery.data && (
        <>
          <RecurringIncomeSection
            templates={templatesQuery.data ?? []}
            tenants={tenants}
            onAdd={() => openCreateRecurring()}
            onEdit={openEditTemplate}
            onDelete={setDeleteTemplateTarget}
          />

          <IncomeMemberCards
            tenants={tenants}
            incomeByTenant={incomeByTenant}
            onSelectTenant={setListTenantId}
            onAddForTenant={openCreateMonth}
          />

          <IncomeStatsKpis stats={statsQuery.data} largestExpense={largestExpense} />

          <div className="grid gap-6 lg:grid-cols-2">
            <BudgetVsExpensesChart stats={statsQuery.data} tenants={tenants} />
            <IncomeTrendChart stats={statsQuery.data} />
          </div>

          <MemberBreakdownTable stats={statsQuery.data} />
        </>
      )}

      <TenantIncomeListModal
        open={listTenantId !== null}
        onClose={() => setListTenantId(null)}
        tenant={listTenant}
        incomes={incomesQuery.data ?? []}
        onEdit={openEditResolved}
        onAdd={() => {
          if (listTenantId) {
            openCreateMonth(listTenantId);
          }
        }}
        onResetOverride={(income) => {
          if (income.overrideId) {
            resetOverrideMutation.mutate(income.overrideId);
          }
        }}
      />

      <IncomeFormModal
        open={formOpen}
        onClose={closeForm}
        householdId={householdId}
        month={month}
        tenants={tenants}
        formMode={formMode}
        editingResolved={editingResolved}
        editingTemplate={editingTemplate}
        initialTenantId={formTenantId}
      />

      <ConfirmModal
        isOpen={deleteTemplateTarget !== null}
        title={t("deleteIncome")}
        message={t("deleteConfirm")}
        variant="danger"
        confirmLabel={tCommon("delete")}
        cancelLabel={tCommon("cancel")}
        onConfirm={() => {
          if (deleteTemplateTarget) {
            deleteTemplateMutation.mutate(deleteTemplateTarget.id);
          }
        }}
        onCancel={() => setDeleteTemplateTarget(null)}
        isLoading={deleteTemplateMutation.isPending}
      />

      <button
        type="button"
        className={fabButton}
        style={{ bottom: fabBottomOffset }}
        onClick={() => openCreateMonth()}
        aria-label={t("addIncome")}
      >
        <Plus className="h-6 w-6" aria-hidden />
      </button>
    </div>
  );
}
