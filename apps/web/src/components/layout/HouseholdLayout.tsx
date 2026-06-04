import { useQuery } from "@tanstack/react-query";
import { NavLink, Outlet, useParams } from "react-router-dom";
import { getApiErrorMessage, getHousehold } from "../../lib/api.ts";
import { queryKeys } from "../../lib/query-keys.ts";
import { ErrorMessage } from "../ui/ErrorMessage.tsx";
import { Skeleton } from "../ui/Skeleton.tsx";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-lg px-3 py-2 text-sm font-medium ${
    isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-200"
  }`;

export function HouseholdLayout() {
  const { id = "" } = useParams<{ id: string }>();

  const householdQuery = useQuery({
    queryKey: queryKeys.household(id),
    queryFn: () => getHousehold(id),
    enabled: Boolean(id),
  });

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <aside className="w-full shrink-0 lg:w-56">
        {householdQuery.isLoading && <Skeleton className="mb-4 h-8 w-full" />}
        {householdQuery.isError && (
          <ErrorMessage
            message={getApiErrorMessage(householdQuery.error)}
            onRetry={() => householdQuery.refetch()}
          />
        )}
        {householdQuery.data && (
          <div className="mb-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Household
            </p>
            <h2 className="text-lg font-semibold text-slate-900">{householdQuery.data.name}</h2>
          </div>
        )}
        <nav className="flex flex-row gap-2 lg:flex-col">
          <NavLink to={`/households/${id}/tenants`} className={navLinkClass} end>
            Members
          </NavLink>
          <NavLink to={`/households/${id}/expenses`} className={navLinkClass}>
            Expenses
          </NavLink>
          <NavLink to={`/households/${id}/balances`} className={navLinkClass}>
            Balances
          </NavLink>
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
