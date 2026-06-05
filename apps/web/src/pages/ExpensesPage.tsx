import type { Category, Expense, ExpenseSplit, Tenant } from "@foyer/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { CategoriesSection } from "../components/expenses/CategoriesSection.tsx";
import { ExpenseEditModal } from "../components/expenses/ExpenseEditModal.tsx";
import { RecurringExpensesSection } from "../components/expenses/RecurringExpensesSection.tsx";
import { inputClassName, selectClassName } from "../components/forms/FormField.tsx";
import { CategoryForm } from "../components/forms/CategoryForm.tsx";
import { ExpenseForm } from "../components/forms/ExpenseForm.tsx";
import { SplitForm } from "../components/forms/SplitForm.tsx";
import { CategoryBadge } from "../components/ui/CategoryBadge.tsx";
import { SplitModeBadge } from "../components/ui/SplitModeBadge.tsx";
import { EmptyState } from "../components/ui/EmptyState.tsx";
import { ErrorMessage } from "../components/ui/ErrorMessage.tsx";
import { ConfirmModal } from "../components/ui/ConfirmModal.tsx";
import { Modal } from "../components/ui/Modal.tsx";
import { ListSkeleton } from "../components/ui/Skeleton.tsx";
import { useFormat } from "../hooks/useFormat.ts";
import {
  createCategory,
  createExpense,
  createSplits,
  deleteExpense,
  getApiErrorMessage,
  getCategories,
  getExpenses,
  getHousehold,
  getSplits,
  getTenants,
  resetExpenseSplits,
} from "../lib/api.ts";
import { exportExpensesToCSV, getCsvHeaders, slugifyHouseholdName } from "../lib/export.ts";
import { isSoloHousehold } from "../lib/household-mode.ts";
import { formatTenantName } from "../lib/format-tenant-name.ts";
import { getActiveTenants } from "../lib/active-tenants.ts";
import { currentMonthValue, type ExpenseListFilters } from "../lib/expense-list-filters.ts";
import {
  initialSplitsFromExpenseSplits,
  isExpenseSplitsComplete,
  splitParticipantsFromExpenseSplits,
} from "../lib/expense-splits.ts";
import { queryKeys } from "../lib/query-keys.ts";
import { mutationToastHandlers } from "../lib/toast.ts";
import type {
  CreateCategoryForm,
  CreateExpenseForm,
  UpdateExpenseForm,
} from "../lib/schemas.ts";
import {
  amount,
  btnPrimary,
  btnSecondary,
  card,
  fabBottomOffset,
  fabButton,
  iconBtn,
  inlineError,
  pageActionsRow,
  pageSubtitle,
  pageTitle,
  stickyFormPanel,
} from "../lib/ui-classes.ts";

function SplitsSummaryList({
  splits,
  tenantNameById,
  formatCurrency,
}: {
  splits: ExpenseSplit[];
  tenantNameById: Map<string, string>;
  formatCurrency: (amount: number) => string;
}) {
  return (
    <ul className="space-y-1 text-sm text-stone-600">
      {splits.map((split) => (
        <li key={split.id}>
          {tenantNameById.get(split.tenantId) ?? split.tenantId}:{" "}
          <span className={amount}>{formatCurrency(split.amount)}</span>
          {split.percentage !== undefined && ` (${split.percentage}%)`}
        </li>
      ))}
    </ul>
  );
}

function ExpenseSplits({
  expense,
  householdId,
  tenants,
  expenseFilters,
}: {
  expense: Expense;
  householdId: string;
  tenants: Tenant[];
  expenseFilters: ExpenseListFilters;
}) {
  const expenseId = expense.id;
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();
  const { t } = useTranslation("expenses");
  const { t: tCommon } = useTranslation("common");
  const { t: tToast } = useTranslation("toast");
  const { formatCurrency } = useFormat();

  const splitsQuery = useQuery({
    queryKey: queryKeys.splits(expenseId),
    queryFn: () => getSplits(expenseId),
    enabled: tenants.length > 0,
  });

  const splitMutation = useMutation({
    mutationFn: (input: { splits: { tenantId: string; percentage: number }[] }) =>
      createSplits(expenseId, input),
    ...mutationToastHandlers({
      successMessage: tToast("splitsSaved"),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.splits(expenseId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.balances(householdId) });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.expenses(householdId, expenseFilters),
        });
        setExpanded(false);
      },
    }),
  });

  const resetMutation = useMutation({
    mutationFn: () => resetExpenseSplits(expenseId),
    ...mutationToastHandlers({
      successMessage: tToast("splitsResetToDefault"),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.splits(expenseId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.balances(householdId) });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.expenses(householdId, expenseFilters),
        });
      },
    }),
  });

  const tenantNameById = new Map(tenants.map((tenant) => [tenant.id, formatTenantName(tenant)]));
  const splits = splitsQuery.data ?? [];
  const splitsComplete = isExpenseSplitsComplete(splits, tenants);

  const splitParticipantTenants = useMemo(
    () => splitParticipantsFromExpenseSplits(tenants, splits),
    [tenants, splits],
  );

  const splitFormInitialSplits = useMemo(
    () => initialSplitsFromExpenseSplits(splitParticipantTenants, splits),
    [splitParticipantTenants, splits],
  );

  const toggleLabel = expanded
    ? t("hideSplits")
    : splitsComplete
      ? t("showSplits")
      : t("customizeSplits");

  return (
    <div className="mt-3 border-t border-border pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className={btnSecondary}
          disabled={splitsQuery.isLoading}
        >
          {splitsQuery.isLoading ? tCommon("loadingSplits") : toggleLabel}
        </button>
        {expense.splitMode === "custom" && (
          <button
            type="button"
            className={btnSecondary}
            disabled={resetMutation.isPending}
            onClick={() => resetMutation.mutate()}
          >
            {resetMutation.isPending ? tCommon("resetting") : t("resetToDefault")}
          </button>
        )}
      </div>
      {resetMutation.isError && (
        <p className={`mt-2 ${inlineError}`}>{getApiErrorMessage(resetMutation.error)}</p>
      )}
      {expanded && !splitsQuery.isLoading && (
        <>
          {splitsComplete && (
            <p className="mt-2 text-xs font-medium text-stone-500">{tCommon("splitBetweenAllMembers")}</p>
          )}
          {splits.length > 0 && (
            <div className="mt-2">
              <SplitsSummaryList
                splits={splits}
                tenantNameById={tenantNameById}
                formatCurrency={formatCurrency}
              />
            </div>
          )}
          {!splitsComplete && tenants.length > 0 && (
            <>
              <SplitForm
                tenants={splitParticipantTenants}
                initialSplits={splitFormInitialSplits}
                onSubmit={(data) => splitMutation.mutate(data)}
                isPending={splitMutation.isPending}
              />
              {splitMutation.isError && (
                <p className={`mt-2 ${inlineError}`}>{getApiErrorMessage(splitMutation.error)}</p>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

interface ExpenseFormsAsideProps {
  householdId: string;
  categories: Category[];
  tenants: Tenant[];
  isSolo?: boolean;
  onCategorySubmit: (data: CreateCategoryForm) => void;
  onExpenseSubmit: (data: CreateExpenseForm | UpdateExpenseForm) => void;
  categoryPending: boolean;
  expensePending: boolean;
  categoryError: unknown;
  expenseError: unknown;
  showCategoryForm: boolean;
}

function ExpenseFormsAside({
  householdId,
  categories,
  tenants,
  isSolo = false,
  onCategorySubmit,
  onExpenseSubmit,
  categoryPending,
  expensePending,
  categoryError,
  expenseError,
  showCategoryForm,
}: ExpenseFormsAsideProps) {
  return (
    <div className="space-y-4">
      <CategoriesSection householdId={householdId} categories={categories} />
      {showCategoryForm && (
        <CategoryForm
          householdId={householdId}
          onSubmit={onCategorySubmit}
          isPending={categoryPending}
        />
      )}
      <ExpenseForm
        householdId={householdId}
        categories={categories}
        tenants={tenants}
        isSolo={isSolo}
        onSubmit={onExpenseSubmit}
        isPending={expensePending}
      />
      {expenseError !== undefined && expenseError !== null && (
        <p className={inlineError}>{getApiErrorMessage(expenseError)}</p>
      )}
      {categoryError !== undefined && categoryError !== null && (
        <p className={inlineError}>{getApiErrorMessage(categoryError)}</p>
      )}
    </div>
  );
}

export function ExpensesPage() {
  const { id: householdId = "" } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { t } = useTranslation("expenses");
  const { t: tCommon } = useTranslation("common");
  const { t: tNav } = useTranslation("nav");
  const { t: tToast } = useTranslation("toast");
  const { t: tRecurring } = useTranslation("recurring");
  const { t: tExport } = useTranslation("export");
  const { formatCurrency, formatDate } = useFormat();

  const csvHeaders = useMemo(() => getCsvHeaders(tExport), [tExport]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; description: string } | null>(
    null,
  );
  const [page, setPage] = useState(1);
  const [month, setMonth] = useState(currentMonthValue);
  const [categoryId, setCategoryId] = useState("");
  const [limit, setLimit] = useState(10);
  const [activeTab, setActiveTab] = useState<"expenses" | "recurring">("expenses");
  const lastGeneratedToastRef = useRef(0);

  const expenseFilters: ExpenseListFilters = {
    page,
    limit,
    month,
    ...(categoryId !== "" && { categoryId }),
  };

  const expensesQuery = useQuery({
    queryKey: queryKeys.expenses(householdId, expenseFilters),
    queryFn: () =>
      getExpenses(householdId, {
        page,
        limit,
        month,
        ...(categoryId !== "" && { categoryId }),
      }),
    enabled: Boolean(householdId),
  });

  const tenantsQuery = useQuery({
    queryKey: queryKeys.tenants(householdId),
    queryFn: () => getTenants(householdId, { includeArchived: true }),
    enabled: Boolean(householdId),
  });

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories(householdId),
    queryFn: () => getCategories(householdId),
    enabled: Boolean(householdId),
  });

  const householdQuery = useQuery({
    queryKey: queryKeys.household(householdId),
    queryFn: () => getHousehold(householdId),
    enabled: Boolean(householdId),
  });

  const createExpenseMutation = useMutation({
    mutationFn: createExpense,
    ...mutationToastHandlers({
      successMessage: tToast("expenseRecorded"),
      onSuccess: () => {
        setPage(1);
        void queryClient.invalidateQueries({ queryKey: ["expenses", householdId] });
        void queryClient.invalidateQueries({ queryKey: queryKeys.balances(householdId) });
        setModalOpen(false);
      },
    }),
  });

  const expenseList = expensesQuery.data?.data ?? [];
  const totalExpenses = expensesQuery.data?.total ?? 0;
  const totalPages = expensesQuery.data?.totalPages ?? 1;
  const recurringGeneratedCount = expensesQuery.data?.recurringGeneratedCount ?? 0;

  useEffect(() => {
    if (
      recurringGeneratedCount > 0 &&
      expensesQuery.isSuccess &&
      recurringGeneratedCount !== lastGeneratedToastRef.current
    ) {
      lastGeneratedToastRef.current = recurringGeneratedCount;
      toast.success(tRecurring("recurringAutoGenerated", { count: recurringGeneratedCount }));
      void queryClient.invalidateQueries({ queryKey: queryKeys.balances(householdId) });
    }
  }, [
    recurringGeneratedCount,
    expensesQuery.isSuccess,
    householdId,
    queryClient,
    tRecurring,
  ]);

  const createCategoryMutation = useMutation({
    mutationFn: createCategory,
    ...mutationToastHandlers({
      successMessage: tToast("categoryAdded"),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.categories(householdId) });
      },
    }),
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: deleteExpense,
    ...mutationToastHandlers({
      successMessage: tToast("expenseDeleted"),
      onSuccess: () => {
        setPendingDelete(null);
        void queryClient.invalidateQueries({ queryKey: ["expenses", householdId] });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.expenses(householdId, expenseFilters),
        });
        void queryClient.invalidateQueries({ queryKey: queryKeys.balances(householdId) });
      },
    }),
  });

  const categoryNameById = new Map(categoriesQuery.data?.map((category) => [category.id, category.name]) ?? []);
  const tenantNameById = new Map(
    tenantsQuery.data?.map((tenant) => [tenant.id, formatTenantName(tenant)]) ?? [],
  );
  const activeTenantsForPickers = getActiveTenants(tenantsQuery.data ?? []);

  const isLoading =
    expensesQuery.isLoading || tenantsQuery.isLoading || categoriesQuery.isLoading;

  const hasCategories = Boolean(categoriesQuery.data && categoriesQuery.data.length > 0);
  const canAddExpense = Boolean(
    activeTenantsForPickers.length > 0 &&
      categoriesQuery.data &&
      categoriesQuery.data.length > 0,
  );

  const handleExportCsv = () => {
    const householdSlug = slugifyHouseholdName(
      householdQuery.data?.name ?? tExport("defaultHouseholdSlug"),
    );
    const filename = `expenses-${householdSlug}-${month}.csv`;
    exportExpensesToCSV(
      expenseList,
      filename,
      {
        categoryNameById,
        tenantNameById,
      },
      csvHeaders,
    );
    toast.success(tExport("csvExported", { count: expenseList.length }));
  };

  const isSolo = householdQuery.data ? isSoloHousehold(householdQuery.data) : false;

  const formsAside =
    canAddExpense && categoriesQuery.data ? (
      <ExpenseFormsAside
        householdId={householdId}
        categories={categoriesQuery.data}
        tenants={activeTenantsForPickers}
        isSolo={isSolo}
        onCategorySubmit={(data) => createCategoryMutation.mutate(data)}
        onExpenseSubmit={(data) => {
          if ("householdId" in data) {
            createExpenseMutation.mutate(data);
          }
        }}
        categoryPending={createCategoryMutation.isPending}
        expensePending={createExpenseMutation.isPending}
        categoryError={createCategoryMutation.error}
        expenseError={createExpenseMutation.error}
        showCategoryForm
      />
    ) : null;

  return (
    <div className="space-y-6">
      <div className={pageActionsRow}>
        <div>
          <h1 className={pageTitle}>{t("title")}</h1>
          <p className={pageSubtitle}>{t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className={`${btnSecondary} inline-flex items-center gap-2`}
            disabled={isLoading || expenseList.length === 0}
            onClick={handleExportCsv}
          >
            <Download className="h-4 w-4" strokeWidth={2} />
            {t("exportCsv")}
          </button>
          {canAddExpense && (
            <button
              type="button"
              className={`${btnPrimary} hidden items-center gap-2 md:inline-flex xl:hidden`}
              onClick={() => setModalOpen(true)}
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              {t("newExpense")}
            </button>
          )}
        </div>
      </div>

      {categoriesQuery.isSuccess && categoriesQuery.data.length === 0 && (
        <EmptyState
          title={t("noCategoriesTitle")}
          description={t("noCategoriesDescription")}
          action={
            <CategoryForm
              householdId={householdId}
              onSubmit={(data) => createCategoryMutation.mutate(data)}
              isPending={createCategoryMutation.isPending}
            />
          }
        />
      )}

      {hasCategories && (
        <div className="flex flex-col gap-8 xl:flex-row xl:items-start">
          <section className="min-w-0 flex-1">
            <div className="mb-4 flex gap-2 border-b border-border">
              <button
                type="button"
                className={`border-b-2 px-3 py-2 text-sm font-medium transition active:opacity-70 ${
                  activeTab === "expenses"
                    ? "border-primary text-primary"
                    : "border-transparent text-stone-600 hover:text-stone-900"
                }`}
                onClick={() => setActiveTab("expenses")}
              >
                {tNav("expensesTab")}
              </button>
              <button
                type="button"
                className={`border-b-2 px-3 py-2 text-sm font-medium transition active:opacity-70 ${
                  activeTab === "recurring"
                    ? "border-primary text-primary"
                    : "border-transparent text-stone-600 hover:text-stone-900"
                }`}
                onClick={() => setActiveTab("recurring")}
              >
                {tNav("recurringTab")}
              </button>
            </div>

            {activeTab === "recurring" && categoriesQuery.data && (
              <RecurringExpensesSection
                householdId={householdId}
                categories={categoriesQuery.data}
                tenants={activeTenantsForPickers}
              />
            )}

            {activeTab === "expenses" && (
              <>
            <div className="mb-4 flex flex-wrap gap-3">
              <div className="space-y-1">
                <label htmlFor="expense-filter-month" className="block text-sm font-medium text-stone-700">
                  {tCommon("month")}
                </label>
                <input
                  id="expense-filter-month"
                  type="month"
                  className={inputClassName}
                  value={month}
                  onChange={(event) => {
                    setMonth(event.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="expense-filter-category"
                  className="block text-sm font-medium text-stone-700"
                >
                  {tCommon("category")}
                </label>
                <select
                  id="expense-filter-category"
                  className={selectClassName}
                  value={categoryId}
                  onChange={(event) => {
                    setCategoryId(event.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">{tCommon("allCategories")}</option>
                  {categoriesQuery.data?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label htmlFor="expense-filter-limit" className="block text-sm font-medium text-stone-700">
                  {tCommon("perPage")}
                </label>
                <select
                  id="expense-filter-limit"
                  className={selectClassName}
                  value={limit}
                  onChange={(event) => {
                    setLimit(Number(event.target.value));
                    setPage(1);
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>
            </div>
            {isLoading && <ListSkeleton />}
            {expensesQuery.isError && (
              <ErrorMessage
                message={getApiErrorMessage(expensesQuery.error)}
                onRetry={() => expensesQuery.refetch()}
              />
            )}
            {expensesQuery.isSuccess && expensesQuery.data.total === 0 && (
              <EmptyState
                title={t("noExpensesTitle")}
                description={t("noExpensesDescription")}
                action={
                  canAddExpense ? (
                    <button
                      type="button"
                      className={`${btnPrimary} hidden items-center gap-2 md:inline-flex xl:hidden`}
                      onClick={() => setModalOpen(true)}
                    >
                      <Plus className="h-4 w-4" strokeWidth={2} />
                      {t("newExpense")}
                    </button>
                  ) : undefined
                }
              />
            )}
            {expensesQuery.isSuccess && expenseList.length > 0 && (
              <ul className="space-y-4">
                {expenseList.map((expense) => {
                  const categoryName = categoryNameById.get(expense.categoryId) ?? tCommon("category");
                  const paidByName = tenantNameById.get(expense.paidByTenantId) ?? tCommon("dash");
                  return (
                    <li key={expense.id} className={card}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <p className="min-w-0 flex-1 font-semibold tracking-tight text-stone-900">
                              {expense.description}
                            </p>
                            <p className={`${amount} shrink-0 text-lg`}>
                              {formatCurrency(expense.amount)}
                            </p>
                          </div>
                          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-stone-600">
                            <CategoryBadge name={categoryName} />
                            <SplitModeBadge splitMode={expense.splitMode} />
                            <span>{formatDate(expense.date)}</span>
                            <span>
                              · {tCommon("paidByPrefix", { name: paidByName })}
                            </span>
                          </p>
                        </div>
                        <div className="flex shrink-0 items-start gap-0">
                          <button
                            type="button"
                            onClick={() => setEditingExpense(expense)}
                            className={iconBtn}
                            aria-label={tCommon("editItem", { name: expense.description })}
                          >
                            <Pencil className="h-4 w-4" strokeWidth={2} />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setPendingDelete({
                                id: expense.id,
                                description: expense.description,
                              })
                            }
                            disabled={deleteExpenseMutation.isPending}
                            className={`${iconBtn} hover:text-negative active:text-negative disabled:opacity-50`}
                            aria-label={tCommon("deleteItem", { name: expense.description })}
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                      {tenantsQuery.data && tenantsQuery.data.length > 0 && !isSolo && (
                        <ExpenseSplits
                          expense={expense}
                          householdId={householdId}
                          tenants={tenantsQuery.data}
                          expenseFilters={expenseFilters}
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {expensesQuery.isSuccess && totalExpenses > 0 && (
              <div className="mt-6 space-y-2">
                <nav
                  className="flex flex-wrap items-center justify-center gap-4"
                  aria-label={tNav("expenseListPagination")}
                >
                  <button
                    type="button"
                    className={btnSecondary}
                    disabled={page <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    {tCommon("previous")}
                  </button>
                  <span className="text-sm text-stone-600">
                    {tCommon("pageOf", { page, totalPages })}
                  </span>
                  <button
                    type="button"
                    className={btnSecondary}
                    disabled={page >= totalPages}
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  >
                    {tCommon("nextPage")}
                  </button>
                </nav>
                <p className="text-center text-sm text-stone-500">
                  {tCommon("showingOf", { shown: expenseList.length, total: totalExpenses })}
                </p>
              </div>
            )}
              </>
            )}
          </section>

          {activeTab === "expenses" && formsAside && (
            <aside className={stickyFormPanel}>{formsAside}</aside>
          )}
        </div>
      )}

      {editingExpense && categoriesQuery.data && (
        <ExpenseEditModal
          expense={editingExpense}
          householdId={householdId}
          categories={categoriesQuery.data}
          tenants={activeTenantsForPickers}
          isSolo={isSolo}
          expenseFilters={expenseFilters}
          open={editingExpense !== null}
          onClose={() => setEditingExpense(null)}
        />
      )}

      <ConfirmModal
        isOpen={pendingDelete !== null}
        title={t("deleteExpenseTitle")}
        message={
          pendingDelete
            ? t("deleteExpenseMessage", { description: pendingDelete.description })
            : ""
        }
        onConfirm={() => {
          if (pendingDelete) {
            deleteExpenseMutation.mutate(pendingDelete.id);
          }
        }}
        onCancel={() => setPendingDelete(null)}
        isLoading={deleteExpenseMutation.isPending}
      />

      {canAddExpense && categoriesQuery.data && (
        <Modal
          title={t("newExpense")}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          fullHeightMobile
        >
          <ExpenseFormsAside
            householdId={householdId}
            categories={categoriesQuery.data}
            tenants={activeTenantsForPickers}
            isSolo={isSolo}
            onCategorySubmit={(data) => createCategoryMutation.mutate(data)}
            onExpenseSubmit={(data) => {
          if ("householdId" in data) {
            createExpenseMutation.mutate(data);
          }
        }}
            categoryPending={createCategoryMutation.isPending}
            expensePending={createExpenseMutation.isPending}
            categoryError={createCategoryMutation.error}
            expenseError={createExpenseMutation.error}
            showCategoryForm
          />
        </Modal>
      )}

      {canAddExpense && hasCategories && (
        <button
          type="button"
          className={fabButton}
          style={{ bottom: fabBottomOffset }}
          onClick={() => setModalOpen(true)}
          aria-label={t("newExpense")}
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
