import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { TenantForm } from "../components/forms/TenantForm.tsx";
import { ConfirmModal } from "../components/ui/ConfirmModal.tsx";
import { EmptyState } from "../components/ui/EmptyState.tsx";
import { ErrorMessage } from "../components/ui/ErrorMessage.tsx";
import { ListSkeleton } from "../components/ui/Skeleton.tsx";
import {
  createTenant,
  deleteHouseholdTenant,
  getApiErrorMessage,
  getTenantRemovalPreview,
  getTenants,
  type TenantRemovalPreview,
} from "../lib/api.ts";
import { formatTenantName } from "../lib/format-tenant-name.ts";
import { formatDate, formatSignedCurrency } from "../lib/format.ts";
import { queryKeys } from "../lib/query-keys.ts";
import { toast } from "sonner";
import { mutationToastHandlers, showMutationError, showMutationSuccess } from "../lib/toast.ts";
import { card, inlineError, pageSubtitle, pageTitle } from "../lib/ui-classes.ts";

type PendingTenantDelete = {
  id: string;
  name: string;
  preview: TenantRemovalPreview;
};

export function TenantsPage() {
  const { id: householdId = "" } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [pendingDelete, setPendingDelete] = useState<PendingTenantDelete | null>(null);
  const [soloBanner, setSoloBanner] = useState(false);
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);

  const tenantsQuery = useQuery({
    queryKey: queryKeys.tenants(householdId),
    queryFn: () => getTenants(householdId, { includeArchived: true }),
    enabled: Boolean(householdId),
  });

  const createMutation = useMutation({
    mutationFn: createTenant,
    ...mutationToastHandlers({
      successMessage: "Member added",
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.tenants(householdId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.balances(householdId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.household(householdId) });
      },
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: (tenantId: string) => deleteHouseholdTenant(householdId, tenantId),
    onSuccess: (result) => {
      showMutationSuccess("Member removed");
      setPendingDelete(null);
      if (result.switchedToSolo) {
        setSoloBanner(true);
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.tenants(householdId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.balances(householdId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.household(householdId) });
      void queryClient.invalidateQueries({ queryKey: ["expenses", householdId] });
    },
    onError: showMutationError,
  });

  const handleDeleteClick = async (tenant: { id: string; name: string }) => {
    setPreviewLoadingId(tenant.id);
    try {
      const preview = await getTenantRemovalPreview(householdId, tenant.id);
      if (Math.abs(preview.balance) > 0.005) {
        toast.error(
          `${tenant.name} has an outstanding balance of ${formatSignedCurrency(preview.balance)}. Settle up before removing.`,
        );
        return;
      }
      setPendingDelete({ id: tenant.id, name: tenant.name, preview });
    } catch (error) {
      showMutationError(error);
    } finally {
      setPreviewLoadingId(null);
    }
  };

  const activeTenants = tenantsQuery.data?.filter((tenant) => tenant.active) ?? [];
  const archivedTenants = tenantsQuery.data?.filter((tenant) => !tenant.active) ?? [];

  const deleteMessage = pendingDelete
    ? pendingDelete.preview.hasHistory
      ? `${pendingDelete.name} will be archived. Their name will remain visible on past expenses as "${pendingDelete.name} (archived)".`
      : `${pendingDelete.name} will be permanently deleted. This cannot be undone.`
    : "";

  const soloWarning =
    pendingDelete?.preview.wouldSwitchToSolo
      ? " After removal, your household will switch to solo mode."
      : "";

  return (
    <div className="space-y-8">
      <div>
        <h1 className={pageTitle}>Members</h1>
        <p className={pageSubtitle}>People in this household.</p>
      </div>

      {soloBanner && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-stone-700">
          Your household is now in solo mode. Add a new member anytime to return to shared mode.
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <section>
          {tenantsQuery.isLoading && <ListSkeleton />}
          {tenantsQuery.isError && (
            <ErrorMessage
              message={getApiErrorMessage(tenantsQuery.error)}
              onRetry={() => tenantsQuery.refetch()}
            />
          )}
          {tenantsQuery.isSuccess && activeTenants.length === 0 && archivedTenants.length === 0 && (
            <EmptyState
              title="No members yet"
              description="Add household members before creating expenses or splits."
              action={
                <p className="text-sm text-stone-500">Use the form on the right to add someone.</p>
              }
            />
          )}
          {tenantsQuery.isSuccess && (activeTenants.length > 0 || archivedTenants.length > 0) && (
            <ul className="space-y-3">
              {activeTenants.map((tenant) => (
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
                      onClick={() => handleDeleteClick(tenant)}
                      disabled={deleteMutation.isPending || previewLoadingId === tenant.id}
                      className="shrink-0 rounded p-1 text-stone-400 transition hover:bg-stone-100 hover:text-negative disabled:opacity-50"
                      aria-label={`Remove ${tenant.name}`}
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={2} />
                    </button>
                  </div>
                </li>
              ))}
              {archivedTenants.map((tenant) => (
                <li key={tenant.id} className={`${card} opacity-75`}>
                  <p className="font-semibold tracking-tight text-stone-600">
                    {formatTenantName(tenant)}
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    Archived {tenant.archivedAt ? formatDate(tenant.archivedAt) : "—"}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {deleteMutation.isError && (
            <p className={`mt-2 ${inlineError}`}>
              {getApiErrorMessage(deleteMutation.error)}{" "}
              <Link to={`/households/${householdId}/balances`} className="font-medium text-primary">
                Go to balances
              </Link>
            </p>
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
        title={pendingDelete?.preview.hasHistory ? "Archive member" : "Remove member permanently"}
        message={`${deleteMessage}${soloWarning}`}
        confirmLabel={pendingDelete?.preview.hasHistory ? "Archive" : "Delete permanently"}
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
