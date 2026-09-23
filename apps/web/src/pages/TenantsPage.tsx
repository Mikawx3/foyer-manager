import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import type { Tenant } from "@foyer/types";
import { HouseholdAccessSection } from "../components/tenants/HouseholdAccessSection.tsx";
import { ArchivedMembersSection } from "../components/tenants/ArchivedMembersSection.tsx";
import { DeleteMemberModal } from "../components/tenants/DeleteMemberModal.tsx";
import { EditMemberModal } from "../components/tenants/EditMemberModal.tsx";
import { TenantForm } from "../components/forms/TenantForm.tsx";
import { EmptyState } from "../components/ui/EmptyState.tsx";
import { ErrorMessage } from "../components/ui/ErrorMessage.tsx";
import { ListSkeleton } from "../components/ui/Skeleton.tsx";
import { useDeploymentMode } from "../contexts/DeploymentModeContext.tsx";
import {
  claimHouseholdTenant,
  createTenant,
  deleteHouseholdTenant,
  getApiErrorMessage,
  getMe,
  getTenantRemovalPreview,
  getTenants,
  updateHouseholdTenant,
  type TenantRemovalPreview,
} from "../lib/api.ts";
import { formatMemberEmail } from "../lib/member-email.ts";
import { queryKeys } from "../lib/query-keys.ts";
import { DEFAULT_TENANT_COLOR } from "../lib/tenant-colors.ts";
import { showMutationError, showMutationSuccess, mutationToastHandlers } from "../lib/toast.ts";
import { card, iconBtn, inlineError, pageSubtitle, pageTitle } from "../lib/ui-classes.ts";

type PendingTenantDelete = {
  id: string;
  name: string;
  preview: TenantRemovalPreview;
};

function invalidateMemberQueries(queryClient: ReturnType<typeof useQueryClient>, householdId: string) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.tenants(householdId) });
  void queryClient.invalidateQueries({ queryKey: queryKeys.balances(householdId) });
  void queryClient.invalidateQueries({ queryKey: queryKeys.household(householdId) });
  void queryClient.invalidateQueries({ queryKey: ["expenses", householdId] });
}

export function TenantsPage() {
  const { id: householdId = "" } = useParams<{ id: string }>();
  const { isCloudMode } = useDeploymentMode();
  const queryClient = useQueryClient();
  const { t } = useTranslation("members");
  const { t: tCommon } = useTranslation("common");
  const { t: tToast } = useTranslation("toast");

  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingTenantDelete | null>(null);
  const [soloBanner, setSoloBanner] = useState(false);
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);

  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: getMe,
    enabled: isCloudMode,
  });
  const householdRole = meQuery.data?.memberships.find(
    (membership) => membership.householdId === householdId,
  )?.role;
  const canManageMembers = !isCloudMode || householdRole === "admin";

  const tenantsQuery = useQuery({
    queryKey: queryKeys.tenants(householdId),
    queryFn: () => getTenants(householdId, { includeArchived: true }),
    enabled: Boolean(householdId),
  });

  const claimMutation = useMutation({
    mutationFn: (tenantId: string) => claimHouseholdTenant(householdId, tenantId),
    onSuccess: () => {
      showMutationSuccess(tToast("memberLinked"));
      invalidateMemberQueries(queryClient, householdId);
      void queryClient.invalidateQueries({ queryKey: queryKeys.me });
    },
    onError: showMutationError,
  });

  const createMutation = useMutation({
    mutationFn: createTenant,
    ...mutationToastHandlers({
      successMessage: tToast("memberAdded"),
      onSuccess: () => invalidateMemberQueries(queryClient, householdId),
    }),
  });

  const removeMutation = useMutation({
    mutationFn: async ({ id, preview }: { id: string; preview: TenantRemovalPreview }) => {
      if (preview.hasHistory) {
        return updateHouseholdTenant(householdId, id, { active: false });
      }
      return deleteHouseholdTenant(householdId, id);
    },
    onSuccess: (result, variables) => {
      showMutationSuccess(
        variables.preview.hasHistory ? tToast("memberArchived") : tToast("memberRemoved"),
      );
      setPendingDelete(null);
      if ("switchedToSolo" in result && result.switchedToSolo) {
        setSoloBanner(true);
      }
      invalidateMemberQueries(queryClient, householdId);
    },
    onError: showMutationError,
  });

  const handleDeleteClick = async (tenant: { id: string; name: string }) => {
    setPreviewLoadingId(tenant.id);
    try {
      const preview = await getTenantRemovalPreview(householdId, tenant.id);
      setPendingDelete({ id: tenant.id, name: tenant.name, preview });
    } catch (error) {
      showMutationError(error);
    } finally {
      setPreviewLoadingId(null);
    }
  };

  const activeTenants = tenantsQuery.data?.filter((tenant) => tenant.active) ?? [];
  const archivedTenants = tenantsQuery.data?.filter((tenant) => !tenant.active) ?? [];
  const canClaimName =
    isCloudMode &&
    meQuery.data?.isGuest !== true &&
    !activeTenants.some((tenant) => tenant.isCurrentUser);

  return (
    <div className="space-y-8">
      <div>
        <h2 className={pageTitle}>{canManageMembers ? t("manageTitle") : t("membersTitle")}</h2>
        <p className={pageSubtitle}>
          {canManageMembers ? t("manageSubtitle") : t("membersSubtitle")}
        </p>
      </div>

      {soloBanner && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-stone-700">
          {tCommon("soloModeBanner")}
        </div>
      )}

      <HouseholdAccessSection householdId={householdId} />

      <div
        className={
          canManageMembers
            ? "flex flex-col gap-8 md:grid md:grid-cols-[1fr_320px]"
            : "flex flex-col gap-8"
        }
      >
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
              title={t("noMembersTitle")}
              description={t("noMembersDescriptionExpenses")}
              action={
                canManageMembers ? (
                  <p className="text-sm text-stone-500">{tCommon("useFormOnRight")}</p>
                ) : undefined
              }
            />
          )}
          {tenantsQuery.isSuccess && activeTenants.length > 0 && (
            <ul className="space-y-3">
              {activeTenants.map((tenant) => {
                const displayEmail = formatMemberEmail(tenant.email);
                return (
                <li key={tenant.id} className={card}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <span
                        className="mt-1.5 h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: tenant.color ?? DEFAULT_TENANT_COLOR }}
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <p className="font-semibold tracking-tight text-stone-900">{tenant.name}</p>
                        {displayEmail !== null && (
                          <p className="text-sm text-stone-600">{displayEmail}</p>
                        )}
                        {isCloudMode && (
                          <p className="mt-1 text-xs text-stone-500">
                            {tenant.isCurrentUser
                              ? t("thisIsYou")
                              : tenant.claimed
                                ? t("linkedAccount")
                                : t("waitingForAccount")}
                          </p>
                        )}
                        {canClaimName && !tenant.claimed && (
                          <button
                            type="button"
                            className="mt-2 text-sm font-medium text-primary"
                            disabled={claimMutation.isPending}
                            onClick={() => claimMutation.mutate(tenant.id)}
                          >
                            {t("thisIsMyName")}
                          </button>
                        )}
                      </div>
                    </div>
                    {canManageMembers && (
                      <div className="flex shrink-0 gap-0">
                        <button
                          type="button"
                          onClick={() => setEditingTenant(tenant)}
                          className={iconBtn}
                          aria-label={tCommon("editItem", { name: tenant.name })}
                        >
                          <Pencil className="h-4 w-4" strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(tenant)}
                          disabled={removeMutation.isPending || previewLoadingId === tenant.id}
                          className={`${iconBtn} hover:text-negative active:text-negative disabled:opacity-50`}
                          aria-label={tCommon("removeItem", { name: tenant.name })}
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={2} />
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              );
              })}
            </ul>
          )}
          {tenantsQuery.isSuccess && (
            <ArchivedMembersSection
              householdId={householdId}
              tenants={archivedTenants}
              canRestore={canManageMembers}
              onRestored={() => invalidateMemberQueries(queryClient, householdId)}
            />
          )}
          {removeMutation.isError && (
            <p className={`mt-2 ${inlineError}`}>{getApiErrorMessage(removeMutation.error)}</p>
          )}
        </section>

        {canManageMembers && (
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
        )}
      </div>

      <EditMemberModal
        isOpen={editingTenant !== null}
        householdId={householdId}
        tenant={editingTenant}
        onClose={() => setEditingTenant(null)}
        onSaved={() => {
          showMutationSuccess(tToast("memberUpdated"));
          invalidateMemberQueries(queryClient, householdId);
        }}
      />

      <DeleteMemberModal
        isOpen={pendingDelete !== null}
        householdId={householdId}
        memberName={pendingDelete?.name ?? ""}
        preview={pendingDelete?.preview ?? null}
        onConfirm={() => {
          if (pendingDelete) {
            removeMutation.mutate({ id: pendingDelete.id, preview: pendingDelete.preview });
          }
        }}
        onCancel={() => setPendingDelete(null)}
        isLoading={removeMutation.isPending}
      />
    </div>
  );
}
