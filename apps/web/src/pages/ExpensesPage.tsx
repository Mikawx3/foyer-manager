import type { Category, Tenant } from "@foyer/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { CategoryForm } from "../components/forms/CategoryForm.tsx";
import { ExpenseForm } from "../components/forms/ExpenseForm.tsx";
import { SplitForm } from "../components/forms/SplitForm.tsx";
import { CategoryBadge } from "../components/ui/CategoryBadge.tsx";
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
} from "../lib/api.ts";
import { formatCurrency, formatDate } from "../lib/format.ts";
import { queryKeys } from "../lib/query-keys.ts";
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

function ExpenseSplits({ expenseId, householdId }: { expenseId: string; householdId: string }) {
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();

  const tenantsQuery = useQuery({
    queryKey: queryKeys.tenants(householdId),
    queryFn: () => getTenants(householdId),
  });

  const splitsQuery = useQuery({
    queryKey: queryKeys.splits(expenseId),
    queryFn: () => getSplits(expenseId),
    enabled: expanded,
  });

  const splitMutation = useMutation({
    mutationFn: (input: { splits: { tenantId: string; percentage: number }[] }) =>
      createSplits(expenseId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.splits(expenseId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.balances(householdId) });
      setExpanded(true);
    },
  });

  const tenantNameById = new Map(tenantsQuery.data?.map((t) => [t.id, t.name]) ?? []);

  return (
    <div className="mt-3 border-t border-border pt-3">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className={btnSecondary}
      >
        {expanded ? "Hide splits" : "Assign splits"}
      </button>
      {expanded && tenantsQuery.data && tenantsQuery.data.length > 0 && (
        <>
          {splitsQuery.data && splitsQuery.data.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm text-stone-600">
              {splitsQuery.data.map((split) => (
                <li key={split.id}>
                  {tenantNameById.get(split.tenantId) ?? split.tenantId}:{" "}
                  <span className={amount}>{formatCurrency(split.amount)}</span>
                  {split.percentage !== undefined && ` (${split.percentage}%)`}
                </li>
              ))}
            </ul>
          )}
          <SplitForm
            tenants={tenantsQuery.data}
            onSubmit={(data) => splitMutation.mutate(data)}
            isPending={splitMutation.isPending}
          />
          {splitMutation.isError && (
            <p className={`mt-2 ${inlineError}`}>{getApiErrorMessage(splitMutation.error)}</p>
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

  const expensesQuery = useQuery({
    queryKey: queryKeys.expenses(householdId),
    queryFn: () => getExpenses(householdId),
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.expenses(householdId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.balances(householdId) });
      setModalOpen(false);
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.categories(householdId) });
    },
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
            {isLoading && <ListSkeleton />}
            {expensesQuery.isError && (
              <ErrorMessage
                message={getApiErrorMessage(expensesQuery.error)}
                onRetry={() => expensesQuery.refetch()}
              />
            )}
            {expensesQuery.isSuccess && expensesQuery.data.length === 0 && (
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
            {expensesQuery.isSuccess && expensesQuery.data.length > 0 && (
              <ul className="space-y-4">
                {expensesQuery.data.map((expense) => {
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
                            <span>· Paid by {tenantNameById.get(expense.paidByTenantId) ?? "—"}</span>
                          </p>
                          <p className="mt-1 text-xs text-stone-500">{formatDate(expense.date)}</p>
                        </div>
                        <p className={`shrink-0 ${amount} text-lg`}>
                          {formatCurrency(expense.amount)}
                        </p>
                      </div>
                      <ExpenseSplits expenseId={expense.id} householdId={householdId} />
                    </li>
                  );
                })}
              </ul>
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
