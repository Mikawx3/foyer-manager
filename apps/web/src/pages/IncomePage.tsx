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
import { RecurringIncomeSection } from "../components/income/RecurringIncomeSection.tsx";
import { TenantIncomeListModal } from "../components/income/TenantIncomeListModal.tsx";
import { IncomeFocusTenantPicker } from "../components/income/IncomeFocusTenantPicker.tsx";
import { ParticipantScopeToggle } from "../components/expenses/ParticipantScopeToggle.tsx";
import { KpiGridSkeleton } from "../components/dashboard/KpiGridSkeleton.tsx";
import { ChartSkeleton } from "../components/dashboard/ChartSkeleton.tsx";
import { CategorySpendingChart } from "../components/stats/CategorySpendingChart.tsx";
import { MonthNavigator } from "../components/stats/MonthNavigator.tsx";
import { ConfirmModal } from "../components/ui/ConfirmModal.tsx";
import { ErrorMessage } from "../components/ui/ErrorMessage.tsx";
import { ListSkeleton } from "../components/ui/Skeleton.tsx";
import {
  deleteIncome,
  deleteIncomeTemplate,
  getApiErrorMessage,
  getCategories,
  getHousehold,
  getIncomeStats,
  getTenants,
  listIncomeTemplates,
  listIncomes,
} from "../lib/api.ts";
import { getCategoryDisplayName } from "../lib/category-label.ts";
import { aggregateIncomeByTenant } from "../lib/income-stats.ts";
import {
  currentMonthValue,
  type ParticipantScope,
} from "../lib/expense-list-filters.ts";
import { isSoloHousehold } from "../lib/household-mode.ts";
import { queryKeys } from "../lib/query-keys.ts";
import { mutationToastHandlers } from "../lib/toast.ts";
import { fabBottomOffset, fabButton, pageSubtitle, pageTitle } from "../lib/ui-classes.ts";

export function IncomePage() {
  const { t } = useTranslation("income");
  const { t: tCommon } = useTranslation("common");
  const { t: tToast } = useTranslation("toast");
  const { t: tCategories } = useTranslation("categories");
  const queryClient = useQueryClient();
  const { id: householdId = "" } = useParams<{ id: string }>();
  const [month, setMonth] = useState(currentMonthValue);
  const [participantScope, setParticipantScope] = useState<ParticipantScope>("all");
  const [focusTenantId, setFocusTenantId] = useState<string | null>(null);

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

  const isSolo = householdQuery.data ? isSoloHousehold(householdQuery.data) : false;
  const effectiveParticipantScope: ParticipantScope = isSolo ? "all" : participantScope;

  const tenantsQuery = useQuery({
    queryKey: queryKeys.tenants(householdId),
    queryFn: () => getTenants(householdId),
    enabled: Boolean(householdId),
  });

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories(householdId),
    queryFn: () => getCategories(householdId),
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

  const tenants = useMemo(
    () => (tenantsQuery.data ?? []).filter((tenant) => tenant.active),
    [tenantsQuery.data],
  );

  const effectiveFocusTenantId =
    effectiveParticipantScope === "personal" && tenants.length > 1
      ? focusTenantId && tenants.some((tenant) => tenant.id === focusTenantId)
        ? focusTenantId
        : (tenants[0]?.id ?? null)
      : null;

  const statsQuery = useQuery({
    queryKey: queryKeys.incomeStats(
      householdId,
      month,
      effectiveParticipantScope,
      effectiveFocusTenantId ?? undefined,
    ),
    queryFn: () =>
      getIncomeStats(
        householdId,
        month,
        effectiveParticipantScope,
        effectiveFocusTenantId ?? undefined,
      ),
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

  const incomeByTenant = useMemo(
    () => aggregateIncomeByTenant(incomesQuery.data ?? []),
    [incomesQuery.data],
  );

  const listTenant = tenants.find((tenant) => tenant.id === listTenantId) ?? null;
  const categories = categoriesQuery.data ?? [];

  const isLoading =
    householdQuery.isLoading ||
    tenantsQuery.isLoading ||
    categoriesQuery.isLoading ||
    templatesQuery.isLoading ||
    incomesQuery.isLoading ||
    statsQuery.isLoading;

  const queryError =
    householdQuery.error ??
    tenantsQuery.error ??
    categoriesQuery.error ??
    templatesQuery.error ??
    incomesQuery.error ??
    statsQuery.error;

  const refetchAll = () => {
    void householdQuery.refetch();
    void tenantsQuery.refetch();
    void categoriesQuery.refetch();
    void templatesQuery.refetch();
    void incomesQuery.refetch();
    void statsQuery.refetch();
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

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <MonthNavigator month={month} onChange={setMonth} />
          {!isSolo && (
            <ParticipantScopeToggle
              value={participantScope}
              onChange={(nextScope) => {
                setParticipantScope(nextScope);
                if (nextScope !== "personal") {
                  setFocusTenantId(null);
                }
              }}
            />
          )}
        </div>
        {!isSolo && effectiveParticipantScope === "personal" && effectiveFocusTenantId && (
          <IncomeFocusTenantPicker
            tenants={tenants}
            value={effectiveFocusTenantId}
            onChange={setFocusTenantId}
          />
        )}
      </div>

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

          <IncomeStatsKpis stats={statsQuery.data} />

          <CategorySpendingChart
            title={t("stats.spendingByCategory")}
            emptyMessage={t("stats.spendingByCategoryEmpty")}
            byCategory={statsQuery.data.byCategory}
            categories={categories}
            getCategoryLabel={(category) => getCategoryDisplayName(category, tCategories)}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <BudgetVsExpensesChart
              stats={statsQuery.data}
              tenants={tenants}
              focusTenantId={effectiveFocusTenantId ?? undefined}
            />
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
