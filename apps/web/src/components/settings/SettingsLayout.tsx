import { useTranslation } from "react-i18next";
import { NavLink, Outlet, useParams } from "react-router-dom";
import { pageTitle } from "../../lib/ui-classes.ts";

const settingsSubNavClass = ({ isActive }: { isActive: boolean }) =>
  `shrink-0 border-b-2 px-1 pb-3 text-sm font-medium transition active:opacity-70 ${
    isActive
      ? "border-primary text-primary"
      : "border-transparent text-stone-600 hover:border-stone-300 hover:text-stone-900"
  }`;

export function SettingsLayout() {
  const { t } = useTranslation("settings");
  const { t: tNav } = useTranslation("nav");
  const { id = "" } = useParams<{ id: string }>();
  const basePath = `/households/${id}/settings`;

  return (
    <div className="space-y-6">
      <h1 className={pageTitle}>{t("title")}</h1>
      <nav
        className="-mb-px flex gap-6 overflow-x-auto border-b border-border [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label={tNav("settingsSections")}
      >
        <NavLink to={basePath} end className={settingsSubNavClass}>
          {tNav("general")}
        </NavLink>
        <NavLink to={`${basePath}/members`} className={settingsSubNavClass}>
          {tNav("manageMembers")}
        </NavLink>
        <NavLink to={`${basePath}/categories`} className={settingsSubNavClass}>
          {tNav("categories")}
        </NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
