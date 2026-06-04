import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { HouseholdForm } from "../components/forms/HouseholdForm.tsx";
import { EmptyState } from "../components/ui/EmptyState.tsx";
import { ErrorMessage } from "../components/ui/ErrorMessage.tsx";
import { ListSkeleton } from "../components/ui/Skeleton.tsx";
import { createHousehold, getApiErrorMessage, getHouseholds } from "../lib/api.ts";
import { queryKeys } from "../lib/query-keys.ts";
import { formatDate } from "../lib/format.ts";
import { cardInteractive, inlineError, pageSubtitle, pageTitle } from "../lib/ui-classes.ts";

export function HouseholdsPage() {
  const queryClient = useQueryClient();

  const householdsQuery = useQuery({
    queryKey: queryKeys.households,
    queryFn: getHouseholds,
  });

  const createMutation = useMutation({
    mutationFn: createHousehold,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.households });
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className={pageTitle}>Households</h1>
        <p className={pageSubtitle}>Manage shared homes and expenses.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <section>
          {householdsQuery.isLoading && <ListSkeleton rows={4} />}
          {householdsQuery.isError && (
            <ErrorMessage
              message={getApiErrorMessage(householdsQuery.error)}
              onRetry={() => householdsQuery.refetch()}
            />
          )}
          {householdsQuery.isSuccess && householdsQuery.data.length === 0 && (
            <EmptyState
              title="No households yet"
              description="Create your first household to start tracking members and expenses."
            />
          )}
          {householdsQuery.isSuccess && householdsQuery.data.length > 0 && (
            <ul className="space-y-3">
              {householdsQuery.data.map((household) => (
                <li key={household.id}>
                  <Link to={`/households/${household.id}/tenants`} className={cardInteractive}>
                    <p className="font-semibold tracking-tight text-stone-900">{household.name}</p>
                    <p className="mt-1 text-sm text-stone-500">
                      Created {formatDate(household.createdAt)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside>
          <HouseholdForm
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
