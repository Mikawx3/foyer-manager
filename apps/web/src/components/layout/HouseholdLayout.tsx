import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, LogOut, Receipt, Scale, Settings, Home } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import { CloudOnly } from "../deployment/CloudOnly.tsx";
import { getApiErrorMessage, getHousehold } from "../../lib/api.ts";
import { clearAuth } from "../../lib/auth-storage.ts";
import { queryKeys } from "../../lib/query-keys.ts";
import { householdNavLinkClass, mobileMainPadding } from "../../lib/ui-classes.ts";
import { ErrorMessage } from "../ui/ErrorMessage.tsx";
import { Skeleton } from "../ui/Skeleton.tsx";
import { MobileBottomTabBar } from "./MobileBottomTabBar.tsx";

const navItems = [
  { to: "dashboard", labelKey: "dashboard", icon: LayoutDashboard, end: true },
  { to: "expenses", labelKey: "expenses", icon: Receipt, end: false },
  { to: "balances", labelKey: "balances", icon: Scale, end: false },
] as const;

export function HouseholdLayout() {
  const { t } = useTranslation("nav");
  const { t: tCommon } = useTranslation("common");
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
    <>
      <div className="flex min-h-screen flex-col gap-6 lg:flex-row lg:gap-8">
        <aside className="hidden w-72 shrink-0 flex-col border-r border-border bg-surface py-6 pl-6 pr-8 pb-6 lg:sticky lg:top-0 lg:flex lg:h-screen lg:overflow-y-auto">
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
                {tCommon("household")}
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-stone-900">
                {householdQuery.data.name}
              </h2>
            </div>
          )}
          <nav className="flex flex-1 flex-col justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              {navItems.map(({ to, labelKey, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={`/households/${id}/${to}`}
                  className={householdNavLinkClass}
                  end={end}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                  {t(labelKey)}
                </NavLink>
              ))}
            </div>
            <div className="mt-6 space-y-4 border-t border-border pt-4">
              <CloudOnly>
                <NavLink
                  to="/households"
                  className={householdNavLinkClass}
                  end={false}
                >
                  <Home className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                  {t("allHouseholds")}
                </NavLink>
              </CloudOnly>
              <NavLink
                to={`/households/${id}/settings`}
                className={householdNavLinkClass}
                end={false}
              >
                <Settings className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                {t("settings")}
              </NavLink>

              <CloudOnly>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-stone-600 transition hover:bg-stone-100 hover:text-stone-900 active:bg-stone-200 active:opacity-80"
                >
                  <LogOut className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                  {t("signOut")}
                </button>
              </CloudOnly>
            </div>
          </nav>
        </aside>
        <main className={`min-w-0 flex-1 overflow-y-auto ${mobileMainPadding}`}>
          {householdQuery.data && (
            <p className="mb-4 text-sm font-medium text-stone-500 lg:hidden">
              {householdQuery.data.name}
            </p>
          )}
          <Outlet />
        </main>
      </div>
      <MobileBottomTabBar householdId={id} />
    </>
  );
}
