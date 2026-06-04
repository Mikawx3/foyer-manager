import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { CategoryForm } from "../components/forms/CategoryForm.tsx";
import { ExpenseForm } from "../components/forms/ExpenseForm.tsx";
import { SplitForm } from "../components/forms/SplitForm.tsx";
import { EmptyState } from "../components/ui/EmptyState.tsx";
import { ErrorMessage } from "../components/ui/ErrorMessage.tsx";
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
    <div className="mt-3 border-t border-slate-100 pt-3">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="text-sm font-medium text-slate-700 hover:text-slate-900"
      >
        {expanded ? "Hide splits" : "Assign splits"}
      </button>
      {expanded && tenantsQuery.data && tenantsQuery.data.length > 0 && (
        <>
          {splitsQuery.data && splitsQuery.data.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              {splitsQuery.data.map((split) => (
                <li key={split.id}>
                  {tenantNameById.get(split.tenantId) ?? split.tenantId}:{" "}
                  {formatCurrency(split.amount)}
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
            <p className="mt-2 text-sm text-red-600">{getApiErrorMessage(splitMutation.error)}</p>
          )}
        </>
      )}
    </div>
  );
}

export function ExpensesPage() {
  const { id: householdId = "" } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
        <p className="mt-1 text-sm text-slate-600">Track spending and split costs.</p>
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

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <section>
          {isLoading && <ListSkeleton />}
          {expensesQuery.isError && (
            <ErrorMessage
              message={getApiErrorMessage(expensesQuery.error)}
              onRetry={() => expensesQuery.refetch()}
            />
          )}
          {expensesQuery.isSuccess && expensesQuery.data.length === 0 && categoriesQuery.data && categoriesQuery.data.length > 0 && (
            <EmptyState
              title="No expenses yet"
              description="Record your first expense using the form on the right."
            />
          )}
          {expensesQuery.isSuccess && expensesQuery.data.length > 0 && (
            <ul className="space-y-4">
              {expensesQuery.data.map((expense) => (
                <li
                  key={expense.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{expense.description}</p>
                      <p className="text-sm text-slate-600">
                        {categoryNameById.get(expense.categoryId) ?? "Category"} · Paid by{" "}
                        {tenantNameById.get(expense.paidByTenantId) ?? "—"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{formatDate(expense.date)}</p>
                    </div>
                    <p className="text-lg font-semibold text-slate-900">
                      {formatCurrency(expense.amount)}
                    </p>
                  </div>
                  <ExpenseSplits expenseId={expense.id} householdId={householdId} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-4">
          {categoriesQuery.data && categoriesQuery.data.length > 0 && (
            <CategoryForm
              householdId={householdId}
              onSubmit={(data) => createCategoryMutation.mutate(data)}
              isPending={createCategoryMutation.isPending}
            />
          )}
          {tenantsQuery.data && categoriesQuery.data && (
            <ExpenseForm
              householdId={householdId}
              categories={categoriesQuery.data}
              tenants={tenantsQuery.data}
              onSubmit={(data) => createExpenseMutation.mutate(data)}
              isPending={createExpenseMutation.isPending}
            />
          )}
          {createExpenseMutation.isError && (
            <p className="text-sm text-red-600">{getApiErrorMessage(createExpenseMutation.error)}</p>
          )}
        </aside>
      </div>
    </div>
  );
}
