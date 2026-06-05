import { LayoutDashboard, Receipt, Scale, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";

interface MobileBottomTabBarProps {
  householdId: string;
}

const tabs = [
  { to: "dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "expenses", label: "Expenses", icon: Receipt, end: false },
  { to: "balances", label: "Balances", icon: Scale, end: false },
  { to: "settings", label: "Settings", icon: Settings, end: false },
] as const;

export function MobileBottomTabBar({ householdId }: MobileBottomTabBarProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/90 backdrop-blur-[12px] pb-[env(safe-area-inset-bottom,0px)] md:hidden"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex h-14 max-w-7xl items-stretch justify-around">
        {tabs.map(({ to, label, icon: Icon, end }) => (
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
                <span className={isActive ? "text-primary" : "text-stone-600"}>{label}</span>
                {isActive && (
                  <span className="absolute bottom-[calc(env(safe-area-inset-bottom,0px)+2px)] h-0.5 w-8 rounded-full bg-primary" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
