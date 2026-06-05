import type { Category, Expense, Tenant } from "@foyer/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { ExpenseForm } from "../forms/ExpenseForm.tsx";
import { Modal } from "../ui/Modal.tsx";
import { getApiErrorMessage, getSplits, updateExpense } from "../../lib/api.ts";
import type { ExpenseListFilters } from "../../lib/expense-list-filters.ts";
import { queryKeys } from "../../lib/query-keys.ts";
import { mutationToastHandlers } from "../../lib/toast.ts";
import type { UpdateExpenseForm } from "../../lib/schemas.ts";
import { inlineError } from "../../lib/ui-classes.ts";

interface ExpenseEditModalProps {
  expense: Expense;
  householdId: string;
  categories: Category[];
  tenants: Tenant[];
  isSolo?: boolean;
  expenseFilters: ExpenseListFilters;
  open: boolean;
  onClose: () => void;
}

export function ExpenseEditModal({
  expense,
  householdId,
  categories,
  tenants,
  isSolo = false,
  expenseFilters,
  open,
  onClose,
}: ExpenseEditModalProps) {
  const queryClient = useQueryClient();

  const splitsQuery = useQuery({
    queryKey: queryKeys.splits(expense.id),
    queryFn: () => getSplits(expense.id),
    enabled: open && tenants.length > 0,
  });

  const initialParticipantIds = useMemo(() => {
    const splits = splitsQuery.data ?? [];
    if (splits.length === 0) {
      return tenants.map((tenant) => tenant.id);
    }
    const fromSplits = splits
      .filter((split) => (split.percentage ?? 0) > 0)
      .map((split) => split.tenantId);
    if (fromSplits.length > 0) {
      return fromSplits;
    }
    return tenants.map((tenant) => tenant.id);
  }, [splitsQuery.data, tenants]);

  const initialSplits = useMemo(
    () =>
      (splitsQuery.data ?? [])
        .filter((split) => split.percentage !== undefined)
        .map((split) => ({
          tenantId: split.tenantId,
          percentage: split.percentage ?? 0,
        })),
    [splitsQuery.data],
  );

  const updateMutation = useMutation({
    mutationFn: (data: UpdateExpenseForm) => updateExpense(expense.id, data),
    ...mutationToastHandlers({
      successMessage: "Expense updated",
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ["expenses", householdId] });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.expenses(householdId, expenseFilters),
        });
        void queryClient.invalidateQueries({ queryKey: queryKeys.splits(expense.id) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.balances(householdId) });
        onClose();
      },
    }),
  });

  return (
    <Modal title="Edit expense" open={open} onClose={onClose}>
      {splitsQuery.isLoading && (
        <p className="text-sm text-stone-500">Loading split details…</p>
      )}
      {splitsQuery.isSuccess && (
        <ExpenseForm
          variant="edit"
          householdId={householdId}
          categories={categories}
          tenants={tenants}
          isSolo={isSolo}
          initialExpense={expense}
          initialParticipantIds={initialParticipantIds}
          initialSplits={initialSplits}
          onSubmit={(data) => updateMutation.mutate(data as UpdateExpenseForm)}
          isPending={updateMutation.isPending}
        />
      )}
      {updateMutation.isError && (
        <p className={`mt-2 ${inlineError}`}>{getApiErrorMessage(updateMutation.error)}</p>
      )}
    </Modal>
  );
}
