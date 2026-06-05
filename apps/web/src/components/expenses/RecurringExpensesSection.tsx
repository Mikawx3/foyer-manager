import type { Category, RecurringExpense, Tenant } from "@foyer/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { RecurringExpenseForm } from "../forms/RecurringExpenseForm.tsx";
import { ConfirmModal } from "../ui/ConfirmModal.tsx";
import { EmptyState } from "../ui/EmptyState.tsx";
import { ErrorMessage } from "../ui/ErrorMessage.tsx";
import { Modal } from "../ui/Modal.tsx";
import { ListSkeleton } from "../ui/Skeleton.tsx";
import {
  createRecurringExpense,
  deleteRecurringExpense,
  getApiErrorMessage,
  getRecurringExpenses,
  updateRecurringExpense,
} from "../../lib/api.ts";
import { formatCurrency, formatDate } from "../../lib/format.ts";
import { queryKeys } from "../../lib/query-keys.ts";
import type { CreateRecurringExpenseForm } from "../../lib/schemas.ts";
import { mutationToastHandlers } from "../../lib/toast.ts";
import { amount, btnPrimary, btnSecondary, card } from "../../lib/ui-classes.ts";

function dueStatus(nextDueDate: string): "due" | "overdue" | null {
  const due = new Date(nextDueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  if (due.getTime() === today.getTime()) {
    return "due";
  }
  if (due < today) {
    return "overdue";
  }
  return null;
}

function formatFrequency(frequency: RecurringExpense["frequency"]): string {
  return frequency.charAt(0).toUpperCase() + frequency.slice(1);
}

interface RecurringExpensesSectionProps {
  householdId: string;
  categories: Category[];
  tenants: Tenant[];
}

export function RecurringExpensesSection({
  householdId,
  categories,
  tenants,
}: RecurringExpensesSectionProps) {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringExpense | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string } | null>(null);

  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]));

  const recurringQuery = useQuery({
    queryKey: queryKeys.recurringExpenses(householdId),
    queryFn: () => getRecurringExpenses(householdId),
    enabled: Boolean(householdId),
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateRecurringExpenseForm) =>
      createRecurringExpense(householdId, {
        ...input,
        ...(input.category !== "" && { category: input.category }),
      }),
    ...mutationToastHandlers({
      successMessage: "Recurring expense created",
      onSuccess: () => {
        setModalOpen(false);
        void queryClient.invalidateQueries({ queryKey: queryKeys.recurringExpenses(householdId) });
      },
    }),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      input,
      active,
    }: {
      id: string;
      input: CreateRecurringExpenseForm;
      active?: boolean;
    }) =>
      updateRecurringExpense(householdId, id, {
        ...input,
        ...(input.category !== "" && { category: input.category }),
        ...(active !== undefined && { active }),
      }),
    ...mutationToastHandlers({
      successMessage: "Recurring expense updated",
      onSuccess: () => {
        setEditing(null);
        void queryClient.invalidateQueries({ queryKey: queryKeys.recurringExpenses(householdId) });
      },
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRecurringExpense(householdId, id),
    ...mutationToastHandlers({
      successMessage: "Recurring expense deleted",
      onSuccess: () => {
        setPendingDelete(null);
        void queryClient.invalidateQueries({ queryKey: queryKeys.recurringExpenses(householdId) });
      },
    }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      updateRecurringExpense(householdId, id, { active }),
    ...mutationToastHandlers({
      successMessage: "Status updated",
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.recurringExpenses(householdId) });
      },
    }),
  });

  const canAdd = tenants.length > 0 && categories.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone-600">
          Automatically generate expenses on a schedule.
        </p>
        {canAdd && (
          <button
            type="button"
            className={`${btnPrimary} inline-flex items-center gap-2`}
            onClick={() => setModalOpen(true)}
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Add recurring expense
          </button>
        )}
      </div>

      {recurringQuery.isLoading && <ListSkeleton rows={3} />}
      {recurringQuery.isError && (
        <ErrorMessage
          message={getApiErrorMessage(recurringQuery.error)}
          onRetry={() => recurringQuery.refetch()}
        />
      )}
      {recurringQuery.isSuccess && recurringQuery.data.length === 0 && (
        <EmptyState
          title="No recurring expenses"
          description="Add a recurring expense to auto-generate entries each period."
        />
      )}
      {recurringQuery.isSuccess && recurringQuery.data.length > 0 && (
        <div className={`${card} overflow-x-auto p-0`}>
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-bg">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-stone-700">Title</th>
                <th className="px-4 py-3 text-right font-medium text-stone-700">Amount</th>
                <th className="px-4 py-3 text-left font-medium text-stone-700">Category</th>
                <th className="px-4 py-3 text-left font-medium text-stone-700">Paid by</th>
                <th className="px-4 py-3 text-left font-medium text-stone-700">Frequency</th>
                <th className="px-4 py-3 text-left font-medium text-stone-700">Next due</th>
                <th className="px-4 py-3 text-left font-medium text-stone-700">Status</th>
                <th className="px-4 py-3 text-right font-medium text-stone-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {recurringQuery.data.map((item) => {
                const status = dueStatus(item.nextDueDate);
                return (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-medium text-stone-900">{item.title}</td>
                    <td className={`px-4 py-3 text-right ${amount}`}>
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {item.category ? (categoryNameById.get(item.category) ?? item.category) : "—"}
                    </td>
                    <td className="px-4 py-3 text-stone-600">{item.paidBy.name}</td>
                    <td className="px-4 py-3 text-stone-600">{formatFrequency(item.frequency)}</td>
                    <td className="px-4 py-3 text-stone-600">
                      <div className="flex flex-wrap items-center gap-2">
                        <span>{formatDate(item.nextDueDate)}</span>
                        {status === "due" && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                            Due today
                          </span>
                        )}
                        {status === "overdue" && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                            Overdue
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          item.active
                            ? "text-positive text-xs font-medium"
                            : "text-stone-500 text-xs font-medium"
                        }
                      >
                        {item.active ? "Active" : "Paused"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          className={btnSecondary}
                          disabled={toggleActiveMutation.isPending}
                          onClick={() =>
                            toggleActiveMutation.mutate({ id: item.id, active: !item.active })
                          }
                        >
                          {item.active ? "Pause" : "Resume"}
                        </button>
                        <button
                          type="button"
                          className="rounded p-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-900"
                          aria-label={`Edit ${item.title}`}
                          onClick={() => setEditing(item)}
                        >
                          <Pencil className="h-4 w-4" strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          className="rounded p-1 text-stone-400 transition hover:bg-stone-100 hover:text-negative"
                          aria-label={`Delete ${item.title}`}
                          onClick={() => setPendingDelete({ id: item.id, title: item.title })}
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal title="Add recurring expense" open={modalOpen} onClose={() => setModalOpen(false)}>
        <RecurringExpenseForm
          householdId={householdId}
          categories={categories}
          tenants={tenants}
          onSubmit={(data) => createMutation.mutate(data)}
          isPending={createMutation.isPending}
        />
      </Modal>

      {editing && (
        <Modal title="Edit recurring expense" open={editing !== null} onClose={() => setEditing(null)}>
          <RecurringExpenseForm
            householdId={householdId}
            categories={categories}
            tenants={tenants}
            initialRecurring={editing}
            onSubmit={(data) => updateMutation.mutate({ id: editing.id, input: data })}
            isPending={updateMutation.isPending}
            submitLabel={updateMutation.isPending ? "Saving…" : "Save changes"}
          />
        </Modal>
      )}

      <ConfirmModal
        isOpen={pendingDelete !== null}
        title="Delete recurring expense"
        message={
          pendingDelete
            ? `Delete "${pendingDelete.title}"? Existing generated expenses will not be removed.`
            : ""
        }
        onConfirm={() => {
          if (pendingDelete) {
            deleteMutation.mutate(pendingDelete.id);
          }
        }}
        onCancel={() => setPendingDelete(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
