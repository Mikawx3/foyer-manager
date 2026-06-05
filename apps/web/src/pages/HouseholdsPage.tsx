import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Home, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ConfirmModal } from "../components/ui/ConfirmModal.tsx";
import { ErrorMessage } from "../components/ui/ErrorMessage.tsx";
import { ListSkeleton } from "../components/ui/Skeleton.tsx";
import { deleteHousehold, getApiErrorMessage, getHouseholds } from "../lib/api.ts";
import { formatDate } from "../lib/format.ts";
import { queryKeys } from "../lib/query-keys.ts";
import { mutationToastHandlers } from "../lib/toast.ts";
import {
  btnPrimary,
  card,
  inlineError,
  pageActionsRow,
  pageSubtitle,
  pageTitle,
} from "../lib/ui-classes.ts";

type PendingHouseholdDelete = { id: string; name: string };

export function HouseholdsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pendingDelete, setPendingDelete] = useState<PendingHouseholdDelete | null>(null);

  const householdsQuery = useQuery({
    queryKey: queryKeys.households,
    queryFn: getHouseholds,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteHousehold,
    ...mutationToastHandlers({
      successMessage: "Household deleted",
      onSuccess: () => {
        setPendingDelete(null);
        void queryClient.invalidateQueries({ queryKey: queryKeys.households });
      },
    }),
  });

  if (householdsQuery.isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className={pageTitle}>Households</h1>
          <p className={pageSubtitle}>Manage shared homes and expenses.</p>
        </div>
        <ListSkeleton rows={4} />
      </div>
    );
  }

  if (householdsQuery.isError) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className={pageTitle}>Households</h1>
          <p className={pageSubtitle}>Manage shared homes and expenses.</p>
        </div>
        <ErrorMessage
          message={getApiErrorMessage(householdsQuery.error)}
          onRetry={() => householdsQuery.refetch()}
        />
      </div>
    );
  }

  const households = householdsQuery.data ?? [];

  if (householdsQuery.isSuccess && households.length === 0) {
    return (
      <div className="flex min-h-[calc(100dvh-10rem)] flex-col items-center justify-center px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Home className="h-8 w-8" strokeWidth={1.5} aria-hidden />
        </div>
        <h1 className="mt-8 text-2xl font-semibold tracking-tight text-stone-900">
          Welcome to Foyer Manager
        </h1>
        <p className="mt-3 max-w-md text-sm text-stone-600">
          Create your first household to start tracking expenses and balances.
        </p>
        <button
          type="button"
          className={`${btnPrimary} mt-8 px-6 py-2.5 text-base`}
          onClick={() => navigate("/households/new")}
        >
          Create my household
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className={pageActionsRow}>
        <div>
          <h1 className={pageTitle}>Households</h1>
          <p className={pageSubtitle}>Manage shared homes and expenses.</p>
        </div>
        <Link to="/households/new" className={`${btnPrimary} inline-flex items-center gap-2`}>
          <Plus className="h-4 w-4" aria-hidden />
          New household
        </Link>
      </div>

      <ul className="space-y-3">
        {households.map((household) => (
          <li key={household.id} className={card}>
            <div className="flex items-start justify-between gap-2">
              <Link to={`/households/${household.id}`} className="min-w-0 flex-1 rounded-lg -m-1 p-1 hover:bg-stone-50">
                <p className="font-semibold tracking-tight text-stone-900">{household.name}</p>
                <p className="mt-1 text-sm text-stone-500">
                  Created {formatDate(household.createdAt)}
                </p>
              </Link>
              <button
                type="button"
                onClick={() => setPendingDelete({ id: household.id, name: household.name })}
                disabled={deleteMutation.isPending}
                className="shrink-0 rounded p-1 text-stone-400 transition hover:bg-stone-100 hover:text-negative disabled:opacity-50"
                aria-label={`Delete ${household.name}`}
              >
                <Trash2 className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {deleteMutation.isError && (
        <p className={inlineError}>{getApiErrorMessage(deleteMutation.error)}</p>
      )}

      <ConfirmModal
        isOpen={pendingDelete !== null}
        title="Delete household"
        message={
          pendingDelete
            ? `Delete "${pendingDelete.name}"? All members, expenses, and balances will be permanently removed. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete household"
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
