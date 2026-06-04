import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { TenantForm } from "../components/forms/TenantForm.tsx";
import { EmptyState } from "../components/ui/EmptyState.tsx";
import { ErrorMessage } from "../components/ui/ErrorMessage.tsx";
import { ListSkeleton } from "../components/ui/Skeleton.tsx";
import { createTenant, getApiErrorMessage, getTenants } from "../lib/api.ts";
import { queryKeys } from "../lib/query-keys.ts";
import { formatDate } from "../lib/format.ts";
import { card, inlineError, pageSubtitle, pageTitle } from "../lib/ui-classes.ts";

export function TenantsPage() {
  const { id: householdId = "" } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const tenantsQuery = useQuery({
    queryKey: queryKeys.tenants(householdId),
    queryFn: () => getTenants(householdId),
    enabled: Boolean(householdId),
  });

  const createMutation = useMutation({
    mutationFn: createTenant,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tenants(householdId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.balances(householdId) });
    },
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
                  <p className="font-semibold tracking-tight text-stone-900">{tenant.name}</p>
                  <p className="text-sm text-stone-600">{tenant.email}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    Joined {formatDate(tenant.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
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
    </div>
  );
}
