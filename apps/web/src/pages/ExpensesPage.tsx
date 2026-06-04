import type { Category, Expense, ExpenseSplit, Tenant } from "@foyer/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { CategoriesSection } from "../components/expenses/CategoriesSection.tsx";
import { inputClassName, selectClassName } from "../components/forms/FormField.tsx";
import { CategoryForm } from "../components/forms/CategoryForm.tsx";
import { ExpenseForm } from "../components/forms/ExpenseForm.tsx";
import { SplitForm } from "../components/forms/SplitForm.tsx";
import { CategoryBadge } from "../components/ui/CategoryBadge.tsx";
import { SplitModeBadge } from "../components/ui/SplitModeBadge.tsx";
import { EmptyState } from "../components/ui/EmptyState.tsx";
import { ErrorMessage } from "../components/ui/ErrorMessage.tsx";
import { Modal } from "../components/ui/Modal.tsx";
import { ListSkeleton } from "../components/ui/Skeleton.tsx";
import {
  createCategory,
  createExpense,
  createSplits,
  getApiErrorMessage,
  getCategories,
  getExpenses,
  getSplits,
  getTenants,
  resetExpenseSplits,
} from "../lib/api.ts";
import { formatCurrency, formatDate } from "../lib/format.ts";
import { currentMonthValue, type ExpenseListFilters } from "../lib/expense-list-filters.ts";
import { isExpenseSplitsComplete } from "../lib/expense-splits.ts";
import { queryKeys } from "../lib/query-keys.ts";
import { mutationToastHandlers } from "../lib/toast.ts";
import type { CreateCategoryForm, CreateExpenseForm } from "../lib/schemas.ts";
import {
  amount,
  btnPrimary,
  btnSecondary,
  card,
  inlineError,
  pageActionsRow,
  pageSubtitle,
  pageTitle,
  stickyFormPanel,
} from "../lib/ui-classes.ts";

function SplitsSummaryList({
  splits,
  tenantNameById,
}: {
  splits: ExpenseSplit[];
  tenantNameById: Map<string, string>;
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

  const splitsQuery = useQuery({
    queryKey: queryKeys.splits(expenseId),
    queryFn: () => getSplits(expenseId),
    enabled: tenants.length > 0,
  });

  const splitMutation = useMutation({
    mutationFn: (input: { splits: { tenantId: string; percentage: number }[] }) =>
      createSplits(expenseId, input),
    ...mutationToastHandlers({
      successMessage: "Splits saved",
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
      successMessage: "Splits reset to default",
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.splits(expenseId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.balances(householdId) });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.expenses(householdId, expenseFilters),
        });
      },
    }),
  });

  const tenantNameById = new Map(tenants.map((t) => [t.id, t.name]));
  const splits = splitsQuery.data ?? [];
  const splitsComplete = isExpenseSplitsComplete(splits, tenants);

  const toggleLabel = expanded
    ? "Hide splits"
    : splitsComplete
      ? "Show splits"
      : "Customize splits";

  return (
    <div className="mt-3 border-t border-border pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className={btnSecondary}
          disabled={splitsQuery.isLoading}
        >
          {splitsQuery.isLoading ? "Loading splits…" : toggleLabel}
        </button>
        {expense.splitMode === "custom" && (
          <button
            type="button"
            className={btnSecondary}
            disabled={resetMutation.isPending}
            onClick={() => resetMutation.mutate()}
          >
            {resetMutation.isPending ? "Resetting…" : "Reset to default"}
          </button>
        )}
      </div>
      {resetMutation.isError && (
        <p className={`mt-2 ${inlineError}`}>{getApiErrorMessage(resetMutation.error)}</p>
      )}
      {expanded && !splitsQuery.isLoading && (
        <>
          {splitsComplete && (
            <p className="mt-2 text-xs font-medium text-stone-500">Split between all members</p>
          )}
          {splits.length > 0 && (
            <div className="mt-2">
              <SplitsSummaryList splits={splits} tenantNameById={tenantNameById} />
            </div>
          )}
          {!splitsComplete && tenants.length > 0 && (
            <>
              <SplitForm
                tenants={tenants}
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
  onCategorySubmit: (data: CreateCategoryForm) => void;
  onExpenseSubmit: (data: CreateExpenseForm) => void;
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
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [month, setMonth] = useState(currentMonthValue);
  const [categoryId, setCategoryId] = useState("");
  const [limit, setLimit] = useState(10);

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
    queryFn: () => getTenants(householdId),
    enabled: Boolean(householdId),
  });

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories(householdId),
    queryFn: () => getCategories(householdId),
    enabled: Boolean(householdId),
  });

  const createExpenseMutation = useMutation({
    mutationFn: createExpense,
    ...mutationToastHandlers({
      successMessage: "Expense recorded",
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

  const createCategoryMutation = useMutation({
    mutationFn: createCategory,
    ...mutationToastHandlers({
      successMessage: "Category added",
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.categories(householdId) });
      },
    }),
  });

  const categoryNameById = new Map(categoriesQuery.data?.map((c) => [c.id, c.name]) ?? []);
  const tenantNameById = new Map(tenantsQuery.data?.map((t) => [t.id, t.name]) ?? []);

  const isLoading =
    expensesQuery.isLoading || tenantsQuery.isLoading || categoriesQuery.isLoading;

  const hasCategories = Boolean(categoriesQuery.data && categoriesQuery.data.length > 0);
  const canAddExpense = Boolean(
    tenantsQuery.data &&
      tenantsQuery.data.length > 0 &&
      categoriesQuery.data &&
      categoriesQuery.data.length > 0,
  );

  const formsAside =
    canAddExpense && categoriesQuery.data && tenantsQuery.data ? (
      <ExpenseFormsAside
        householdId={householdId}
        categories={categoriesQuery.data}
        tenants={tenantsQuery.data}
        onCategorySubmit={(data) => createCategoryMutation.mutate(data)}
        onExpenseSubmit={(data) => createExpenseMutation.mutate(data)}
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
          <h1 className={pageTitle}>Expenses</h1>
          <p className={pageSubtitle}>Track spending and split costs.</p>
        </div>
        {canAddExpense && (
          <button
            type="button"
            className={`${btnPrimary} inline-flex items-center gap-2 xl:hidden`}
            onClick={() => setModalOpen(true)}
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            New expense
          </button>
        )}
      </div>

      {categoriesQuery.isSuccess && categoriesQuery.data.length === 0 && (
        <EmptyState
          title="No categories yet"
          description="Create at least one category before adding expenses."
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
            <div className="mb-4 flex flex-wrap gap-3">
              <div className="space-y-1">
                <label htmlFor="expense-filter-month" className="block text-sm font-medium text-stone-700">
                  Month
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
                  Category
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
                  <option value="">All categories</option>
                  {categoriesQuery.data?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label htmlFor="expense-filter-limit" className="block text-sm font-medium text-stone-700">
                  Per page
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
                title="No expenses yet"
                description="Add your first expense using the panel on the right, or the button above on smaller screens."
                action={
                  canAddExpense ? (
                    <button
                      type="button"
                      className={`${btnPrimary} inline-flex items-center gap-2 xl:hidden`}
                      onClick={() => setModalOpen(true)}
                    >
                      <Plus className="h-4 w-4" strokeWidth={2} />
                      New expense
                    </button>
                  ) : undefined
                }
              />
            )}
            {expensesQuery.isSuccess && expenseList.length > 0 && (
              <ul className="space-y-4">
                {expenseList.map((expense) => {
                  const categoryName = categoryNameById.get(expense.categoryId) ?? "Category";
                  return (
                    <li key={expense.id} className={card}>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold tracking-tight text-stone-900">
                            {expense.description}
                          </p>
                          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-stone-600">
                            <CategoryBadge name={categoryName} />
                            <SplitModeBadge splitMode={expense.splitMode} />
                            <span>· Paid by {tenantNameById.get(expense.paidByTenantId) ?? "—"}</span>
                          </p>
                          <p className="mt-1 text-xs text-stone-500">{formatDate(expense.date)}</p>
                        </div>
                        <p className={`shrink-0 ${amount} text-lg`}>
                          {formatCurrency(expense.amount)}
                        </p>
                      </div>
                      {tenantsQuery.data && tenantsQuery.data.length > 0 && (
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
                  aria-label="Expense list pagination"
                >
                  <button
                    type="button"
                    className={btnSecondary}
                    disabled={page <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    ← Previous
                  </button>
                  <span className="text-sm text-stone-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    type="button"
                    className={btnSecondary}
                    disabled={page >= totalPages}
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  >
                    Next →
                  </button>
                </nav>
                <p className="text-center text-sm text-stone-500">
                  Showing {expenseList.length} of {totalExpenses} expenses
                </p>
              </div>
            )}
          </section>

          {formsAside && <aside className={stickyFormPanel}>{formsAside}</aside>}
        </div>
      )}

      {canAddExpense && categoriesQuery.data && tenantsQuery.data && (
        <Modal title="New expense" open={modalOpen} onClose={() => setModalOpen(false)}>
          <ExpenseFormsAside
            householdId={householdId}
            categories={categoriesQuery.data}
            tenants={tenantsQuery.data}
            onCategorySubmit={(data) => createCategoryMutation.mutate(data)}
            onExpenseSubmit={(data) => createExpenseMutation.mutate(data)}
            categoryPending={createCategoryMutation.isPending}
            expensePending={createExpenseMutation.isPending}
            categoryError={createCategoryMutation.error}
            expenseError={createExpenseMutation.error}
            showCategoryForm
          />
        </Modal>
      )}
    </div>
  );
}
