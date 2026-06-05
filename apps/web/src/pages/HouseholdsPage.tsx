import { useQuery } from "@tanstack/react-query";
import { Home } from "lucide-react";
import { Link } from "react-router-dom";
import { ErrorMessage } from "../components/ui/ErrorMessage.tsx";
import { ListSkeleton } from "../components/ui/Skeleton.tsx";
import { useDeploymentMode } from "../hooks/useDeploymentMode.ts";
import { getApiErrorMessage, getHouseholds } from "../lib/api.ts";
import { formatDate } from "../lib/format.ts";
import { queryKeys } from "../lib/query-keys.ts";
import { card, cardInteractive, pageSubtitle, pageTitle } from "../lib/ui-classes.ts";

export function HouseholdsPage() {
  const { isLoading: isConfigLoading } = useDeploymentMode();

  const householdsQuery = useQuery({
    queryKey: queryKeys.households,
    queryFn: getHouseholds,
    enabled: !isConfigLoading,
  });

  if (isConfigLoading || householdsQuery.isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className={pageTitle}>Households</h1>
          <p className={pageSubtitle}>Your homes and shared expenses.</p>
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
          <p className={pageSubtitle}>Your homes and shared expenses.</p>
        </div>
        <ErrorMessage
          message={getApiErrorMessage(householdsQuery.error)}
          onRetry={() => householdsQuery.refetch()}
        />
      </div>
    );
  }

  const households = householdsQuery.data ?? [];

  if (households.length === 0) {
    return (
      <div className="flex min-h-[calc(100dvh-10rem)] flex-col items-center justify-center px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Home className="h-8 w-8" strokeWidth={1.5} aria-hidden />
        </div>
        <h1 className="mt-8 text-2xl font-semibold tracking-tight text-stone-900">
          Set up your household
        </h1>
        <p className="mt-3 max-w-md text-sm text-stone-600">
          Complete onboarding to add members and start tracking expenses.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className={pageTitle}>Households</h1>
        <p className={pageSubtitle}>Select a household or manage your home.</p>
      </div>

      <ul className="space-y-3">
        {households.map((household) => (
          <li key={household.id} className={card}>
            <Link
              to={`/households/${household.id}/dashboard`}
              className={`${cardInteractive} block -m-1 p-1`}
            >
              <p className="font-semibold tracking-tight text-stone-900">{household.name}</p>
              <p className="mt-1 text-sm capitalize text-stone-600">{household.type} household</p>
              <p className="mt-1 text-sm text-stone-500">
                Created {formatDate(household.createdAt)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
