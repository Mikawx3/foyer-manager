import type { Category, RecurringExpense, Tenant } from "@foyer/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFormat } from "../../hooks/useFormat.ts";
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
import { queryKeys } from "../../lib/query-keys.ts";
import type { CreateRecurringExpenseForm } from "../../lib/schemas.ts";
import { mutationToastHandlers } from "../../lib/toast.ts";
import { amount, btnPrimary, btnSecondary, card, iconBtn } from "../../lib/ui-classes.ts";

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
  const { t } = useTranslation("recurring");
  const { t: tCommon } = useTranslation("common");
  const { t: tToast } = useTranslation("toast");
  const { formatCurrency, formatDate } = useFormat();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringExpense | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    title: string;
    generatedExpenseCount: number;
  } | null>(null);

  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]));

  const recurringQuery = useQuery({
    queryKey: queryKeys.recurringExpenses(householdId),
    queryFn: () => getRecurringExpenses(householdId),
    enabled: Boolean(householdId),
  });

  const invalidateRecurringSideEffects = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.recurringExpenses(householdId) });
    void queryClient.invalidateQueries({ queryKey: ["expenses", householdId] });
    void queryClient.invalidateQueries({ queryKey: queryKeys.balances(householdId) });
  };

  const createMutation = useMutation({
    mutationFn: (input: CreateRecurringExpenseForm) =>
      createRecurringExpense(householdId, {
        ...input,
        ...(input.category !== "" && { category: input.category }),
      }),
    ...mutationToastHandlers({
      successMessage: tToast("recurringCreated"),
      onSuccess: () => {
        setModalOpen(false);
        invalidateRecurringSideEffects();
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
      successMessage: tToast("recurringUpdated"),
      onSuccess: () => {
        setEditing(null);
        invalidateRecurringSideEffects();
      },
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRecurringExpense(householdId, id),
    ...mutationToastHandlers({
      successMessage: tToast("recurringDeleted"),
      onSuccess: () => {
        setPendingDelete(null);
        invalidateRecurringSideEffects();
      },
    }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      updateRecurringExpense(householdId, id, { active }),
    ...mutationToastHandlers({
      successMessage: tToast("statusUpdated"),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.recurringExpenses(householdId) });
      },
    }),
  });

  const canAdd = tenants.length > 0 && categories.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone-600">{t("sectionDescription")}</p>
        {canAdd && (
          <button
            type="button"
            className={`${btnPrimary} inline-flex items-center gap-2`}
            onClick={() => setModalOpen(true)}
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            {t("addRecurringExpense")}
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
          title={t("noRecurringTitle")}
          description={t("noRecurringDescription")}
        />
      )}
      {recurringQuery.isSuccess && recurringQuery.data.length > 0 && (
        <>
          <ul className="space-y-3 md:hidden">
            {recurringQuery.data.map((item) => {
              const status = dueStatus(item.nextDueDate);
              return (
                <li key={item.id} className={card}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="font-semibold text-stone-900">{item.title}</p>
                        <p className={`${amount} shrink-0`}>{formatCurrency(item.amount)}</p>
                      </div>
                      <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-stone-600">
                        <span>
                          {item.category
                            ? (categoryNameById.get(item.category) ?? item.category)
                            : tCommon("dash")}
                        </span>
                        <span>· {tCommon(item.frequency)}</span>
                        <span>· {formatDate(item.nextDueDate)}</span>
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {status === "due" && (
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                            {tCommon("dueToday")}
                          </span>
                        )}
                        {status === "overdue" && (
                          <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800">
                            {tCommon("overdue")}
                          </span>
                        )}
                        <span
                          className={
                            item.active
                              ? "text-xs font-medium text-positive"
                              : "text-xs font-medium text-stone-500"
                          }
                        >
                          {item.active ? tCommon("active") : tCommon("paused")}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      <button
                        type="button"
                        className={iconBtn}
                        aria-label={tCommon("editItem", { name: item.title })}
                        onClick={() => setEditing(item)}
                      >
                        <Pencil className="h-4 w-4" strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        className={`${iconBtn} hover:text-negative active:text-negative`}
                        aria-label={tCommon("deleteItem", { name: item.title })}
                        onClick={() =>
                          setPendingDelete({
                            id: item.id,
                            title: item.title,
                            generatedExpenseCount: item.generatedExpenseCount,
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`${btnSecondary} mt-3 w-full`}
                    disabled={toggleActiveMutation.isPending}
                    onClick={() =>
                      toggleActiveMutation.mutate({ id: item.id, active: !item.active })
                    }
                  >
                    {item.active ? tCommon("pause") : tCommon("resume")}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className={`${card} hidden overflow-x-auto p-0 md:block`}>
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-bg">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-stone-700">{t("tableTitle")}</th>
                <th className="px-4 py-3 text-right font-medium text-stone-700">{t("tableAmount")}</th>
                <th className="px-4 py-3 text-left font-medium text-stone-700">{t("tableCategory")}</th>
                <th className="px-4 py-3 text-left font-medium text-stone-700">{t("tablePaidBy")}</th>
                <th className="px-4 py-3 text-left font-medium text-stone-700">{t("tableFrequency")}</th>
                <th className="px-4 py-3 text-left font-medium text-stone-700">{t("tableNextDue")}</th>
                <th className="px-4 py-3 text-left font-medium text-stone-700">{t("tableStatus")}</th>
                <th className="px-4 py-3 text-right font-medium text-stone-700">{t("tableActions")}</th>
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
                      {item.category ? (categoryNameById.get(item.category) ?? item.category) : tCommon("dash")}
                    </td>
                    <td className="px-4 py-3 text-stone-600">{item.paidBy.name}</td>
                    <td className="px-4 py-3 text-stone-600">{tCommon(item.frequency)}</td>
                    <td className="px-4 py-3 text-stone-600">
                      <div className="flex flex-wrap items-center gap-2">
                        <span>{formatDate(item.nextDueDate)}</span>
                        {status === "due" && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                            {tCommon("dueToday")}
                          </span>
                        )}
                        {status === "overdue" && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                            {tCommon("overdue")}
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
                        {item.active ? tCommon("active") : tCommon("paused")}
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
                          {item.active ? tCommon("pause") : tCommon("resume")}
                        </button>
                        <button
                          type="button"
                          className="rounded p-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-900"
                          aria-label={tCommon("editItem", { name: item.title })}
                          onClick={() => setEditing(item)}
                        >
                          <Pencil className="h-4 w-4" strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          className="rounded p-1 text-stone-400 transition hover:bg-stone-100 hover:text-negative"
                          aria-label={tCommon("deleteItem", { name: item.title })}
                          onClick={() =>
                            setPendingDelete({
                              id: item.id,
                              title: item.title,
                              generatedExpenseCount: item.generatedExpenseCount,
                            })
                          }
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
        </>
      )}

      <Modal title={t("addRecurringExpense")} open={modalOpen} onClose={() => setModalOpen(false)}>
        <RecurringExpenseForm
          householdId={householdId}
          categories={categories}
          tenants={tenants}
          onSubmit={(data) => createMutation.mutate(data)}
          isPending={createMutation.isPending}
        />
      </Modal>

      {editing && (
        <Modal title={t("editRecurringExpense")} open={editing !== null} onClose={() => setEditing(null)}>
          <RecurringExpenseForm
            householdId={householdId}
            categories={categories}
            tenants={tenants}
            initialRecurring={editing}
            onSubmit={(data) => updateMutation.mutate({ id: editing.id, input: data })}
            isPending={updateMutation.isPending}
            submitLabel={updateMutation.isPending ? tCommon("saving") : t("saveChanges")}
          />
        </Modal>
      )}

      <ConfirmModal
        isOpen={pendingDelete !== null}
        title={t("deleteRecurringTitle")}
        message={
          pendingDelete
            ? pendingDelete.generatedExpenseCount > 0
              ? t("deleteRecurringWithGenerated", {
                  title: pendingDelete.title,
                  count: pendingDelete.generatedExpenseCount,
                })
              : t("deleteRecurringSimple", { title: pendingDelete.title })
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
