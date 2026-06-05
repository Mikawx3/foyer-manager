import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, LogOut, Receipt, Scale, Settings, Home } from "lucide-react";
import { NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import { CloudOnly } from "../deployment/CloudOnly.tsx";
import { getApiErrorMessage, getHousehold } from "../../lib/api.ts";
import { clearAuth } from "../../lib/auth-storage.ts";
import { queryKeys } from "../../lib/query-keys.ts";
import { householdNavLinkClass } from "../../lib/ui-classes.ts";
import { ErrorMessage } from "../ui/ErrorMessage.tsx";
import { Skeleton } from "../ui/Skeleton.tsx";

const navItems = [
  { to: "dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "expenses", label: "Expenses", icon: Receipt, end: false },
  { to: "balances", label: "Balances", icon: Scale, end: false },
] as const;

export function HouseholdLayout() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const householdQuery = useQuery({
    queryKey: queryKeys.household(id),
    queryFn: () => getHousehold(id),
    enabled: Boolean(id),
  });

  const handleSignOut = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
      <aside className="flex w-full shrink-0 flex-col rounded-xl border border-border bg-surface p-5 pb-6 lg:sticky lg:top-24 lg:min-h-[calc(100dvh-7rem)] lg:w-72 lg:flex-col lg:self-start lg:rounded-none lg:border-r lg:border-y-0 lg:border-l-0 lg:py-6 lg:pb-8 lg:pl-6 lg:pr-8">
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
        <nav className="flex flex-1 flex-col gap-4 lg:justify-between">
          <div className="flex flex-row gap-2 lg:flex-col lg:gap-1.5">
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
          </div>
          <div className="space-y-4 border-t border-border pt-4 lg:mt-6">
            <CloudOnly>
              <NavLink
                to="/households"
                className={householdNavLinkClass}
                end={false}
              >
                <Home className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                All households
              </NavLink>
            </CloudOnly>
            <NavLink
              to={`/households/${id}/settings`}
              className={householdNavLinkClass}
              end={false}
            >
              <Settings className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
              Settings
            </NavLink>

            <CloudOnly>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
              >
                <LogOut className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                Sign out
              </button>
            </CloudOnly>
          </div>
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
