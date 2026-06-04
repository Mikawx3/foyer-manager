import { useQuery } from "@tanstack/react-query";
import { Receipt, Scale, Users } from "lucide-react";
import { NavLink, Outlet, useParams } from "react-router-dom";
import { getApiErrorMessage, getHousehold } from "../../lib/api.ts";
import { queryKeys } from "../../lib/query-keys.ts";
import { householdNavLinkClass } from "../../lib/ui-classes.ts";
import { ErrorMessage } from "../ui/ErrorMessage.tsx";
import { Skeleton } from "../ui/Skeleton.tsx";

const navItems = [
  { to: "tenants", label: "Members", icon: Users, end: true },
  { to: "expenses", label: "Expenses", icon: Receipt, end: false },
  { to: "balances", label: "Balances", icon: Scale, end: false },
] as const;

export function HouseholdLayout() {
  const { id = "" } = useParams<{ id: string }>();

  const householdQuery = useQuery({
    queryKey: queryKeys.household(id),
    queryFn: () => getHousehold(id),
    enabled: Boolean(id),
  });

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
      <aside className="w-full shrink-0 rounded-xl border border-border bg-surface p-5 lg:sticky lg:top-24 lg:w-64 lg:self-start lg:rounded-none lg:border-r lg:border-y-0 lg:border-l-0 lg:py-0 lg:pr-6">
        {householdQuery.isLoading && <Skeleton className="mb-4 h-8 w-full" />}
        {householdQuery.isError && (
          <ErrorMessage
            message={getApiErrorMessage(householdQuery.error)}
            onRetry={() => householdQuery.refetch()}
          />
        )}
        {householdQuery.data && (
          <div className="mb-5 border-b border-border pb-4">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
              Household
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-stone-900">
              {householdQuery.data.name}
            </h2>
          </div>
        )}
        <nav className="flex flex-row gap-2 lg:flex-col lg:gap-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={`/households/${id}/${to}`}
              className={householdNavLinkClass}
              end={end}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
