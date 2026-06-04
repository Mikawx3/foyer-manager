import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { TenantForm } from "../components/forms/TenantForm.tsx";
import { ConfirmModal } from "../components/ui/ConfirmModal.tsx";
import { EmptyState } from "../components/ui/EmptyState.tsx";
import { ErrorMessage } from "../components/ui/ErrorMessage.tsx";
import { ListSkeleton } from "../components/ui/Skeleton.tsx";
import { createTenant, deleteTenant, getApiErrorMessage, getTenants } from "../lib/api.ts";
import { queryKeys } from "../lib/query-keys.ts";
import { mutationToastHandlers } from "../lib/toast.ts";
import { formatDate } from "../lib/format.ts";
import { card, inlineError, pageSubtitle, pageTitle } from "../lib/ui-classes.ts";

type PendingTenantDelete = { id: string; name: string };

export function TenantsPage() {
  const { id: householdId = "" } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [pendingDelete, setPendingDelete] = useState<PendingTenantDelete | null>(null);

  const tenantsQuery = useQuery({
    queryKey: queryKeys.tenants(householdId),
    queryFn: () => getTenants(householdId),
    enabled: Boolean(householdId),
  });

  const createMutation = useMutation({
    mutationFn: createTenant,
    ...mutationToastHandlers({
      successMessage: "Member added",
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.tenants(householdId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.balances(householdId) });
      },
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTenant,
    ...mutationToastHandlers({
      successMessage: "Member removed",
      onSuccess: () => {
        setPendingDelete(null);
        void queryClient.invalidateQueries({ queryKey: queryKeys.tenants(householdId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.balances(householdId) });
        void queryClient.invalidateQueries({ queryKey: ["expenses", householdId] });
      },
    }),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className={pageTitle}>Members</h1>
        <p className={pageSubtitle}>People in this household.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <section>
          {tenantsQuery.isLoading && <ListSkeleton />}
          {tenantsQuery.isError && (
            <ErrorMessage
              message={getApiErrorMessage(tenantsQuery.error)}
              onRetry={() => tenantsQuery.refetch()}
            />
          )}
          {tenantsQuery.isSuccess && tenantsQuery.data.length === 0 && (
            <EmptyState
              title="No members yet"
              description="Add household members before creating expenses or splits."
              action={
                <p className="text-sm text-stone-500">Use the form on the right to add someone.</p>
              }
            />
          )}
          {tenantsQuery.isSuccess && tenantsQuery.data.length > 0 && (
            <ul className="space-y-3">
              {tenantsQuery.data.map((tenant) => (
                <li key={tenant.id} className={card}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold tracking-tight text-stone-900">{tenant.name}</p>
                      <p className="text-sm text-stone-600">{tenant.email}</p>
                      <p className="mt-1 text-xs text-stone-500">
                        Joined {formatDate(tenant.createdAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPendingDelete({ id: tenant.id, name: tenant.name })}
                      disabled={deleteMutation.isPending}
                      className="shrink-0 rounded p-1 text-stone-400 transition hover:bg-stone-100 hover:text-negative disabled:opacity-50"
                      aria-label={`Remove ${tenant.name}`}
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={2} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {deleteMutation.isError && (
            <p className={`mt-2 ${inlineError}`}>{getApiErrorMessage(deleteMutation.error)}</p>
          )}
        </section>

        <aside>
          <TenantForm
            householdId={householdId}
            onSubmit={(data) => createMutation.mutate(data)}
            isPending={createMutation.isPending}
          />
          {createMutation.isError && (
            <p className={`mt-2 ${inlineError}`}>{getApiErrorMessage(createMutation.error)}</p>
          )}
        </aside>
      </div>

      <ConfirmModal
        isOpen={pendingDelete !== null}
        title="Remove member"
        message={
          pendingDelete
            ? `Remove ${pendingDelete.name} from the household? Their expense history will be kept.`
            : ""
        }
        confirmLabel="Remove"
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
