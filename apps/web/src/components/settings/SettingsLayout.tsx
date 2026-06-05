import { NavLink, Outlet, useParams } from "react-router-dom";
import { pageTitle } from "../../lib/ui-classes.ts";

const settingsSubNavClass = ({ isActive }: { isActive: boolean }) =>
  `border-b-2 px-1 pb-3 text-sm font-medium transition ${
    isActive
      ? "border-primary text-primary"
      : "border-transparent text-stone-600 hover:border-stone-300 hover:text-stone-900"
  }`;

export function SettingsLayout() {
  const { id = "" } = useParams<{ id: string }>();
  const basePath = `/households/${id}/settings`;

  return (
    <div className="space-y-6">
      <h1 className={pageTitle}>Settings</h1>
      <nav className="-mb-px flex gap-6 border-b border-border" aria-label="Settings sections">
        <NavLink to={basePath} end className={settingsSubNavClass}>
          General
        </NavLink>
        <NavLink to={`${basePath}/members`} className={settingsSubNavClass}>
          Manage members
        </NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
