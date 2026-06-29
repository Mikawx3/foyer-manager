import { LayoutDashboard, Receipt, Scale } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router-dom";
import { MoreNavSheet, MoreTabButton } from "./MoreNavSheet.tsx";

interface MobileBottomTabBarProps {
  householdId: string;
}

const tabs = [
  { to: "dashboard", labelKey: "dashboardShort", icon: LayoutDashboard, end: true },
  { to: "expenses", labelKey: "expenses", icon: Receipt, end: false },
  { to: "balances", labelKey: "balances", icon: Scale, end: false },
] as const;

const morePaths = ["income", "settings"];

export function MobileBottomTabBar({ householdId }: MobileBottomTabBarProps) {
  const { t } = useTranslation("nav");
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = morePaths.some((segment) =>
    location.pathname.includes(`/households/${householdId}/${segment}`),
  );

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 h-14 border-t border-border bg-surface pb-[env(safe-area-inset-bottom,0px)] lg:hidden"
        aria-label={t("mainNavigation")}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-stretch justify-around">
          {tabs.map(({ to, labelKey, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={`/households/${householdId}/${to}`}
              end={end}
              className={({ isActive }) =>
                `relative flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-xs font-medium transition active:opacity-70 ${
                  isActive ? "text-primary" : "text-stone-500"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`h-5 w-5 shrink-0 ${isActive ? "text-primary" : "text-stone-500"}`}
                    strokeWidth={isActive ? 2.5 : 2}
                    aria-hidden
                  />
                  <span className={isActive ? "text-primary" : "text-stone-600"}>
                    {t(labelKey)}
                  </span>
                  {isActive && (
                    <span className="absolute bottom-[calc(env(safe-area-inset-bottom,0px)+2px)] h-0.5 w-8 rounded-full bg-primary" />
                  )}
                </>
              )}
            </NavLink>
          ))}
          <MoreTabButton isActive={isMoreActive} onClick={() => setMoreOpen(true)} />
        </div>
      </nav>
      <MoreNavSheet
        householdId={householdId}
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
      />
    </>
  );
}
