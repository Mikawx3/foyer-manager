import { useTranslation } from "react-i18next";
import { Outlet, useMatches } from "react-router-dom";
import { CloudOnly } from "../deployment/CloudOnly.tsx";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.ts";
import { formatDocumentTitle, getAppName } from "../../lib/app-name.ts";
import { readRouteTitle } from "../../lib/document-title.ts";
import { AppHeader } from "./AppHeader.tsx";
import { UserMenu } from "./UserMenu.tsx";

export function AppLayout() {
  const matches = useMatches();
  const routeTitle = [...matches]
    .reverse()
    .map((match) => readRouteTitle(match.handle))
    .find((title) => title !== null);
  const { t } = useTranslation(routeTitle?.titleNs ?? "common");
  useDocumentTitle(routeTitle ? formatDocumentTitle(t(routeTitle.titleKey)) : getAppName());

  return (
    <div className="min-h-screen bg-bg">
      <AppHeader
        trailing={
          <CloudOnly>
            <UserMenu />
          </CloudOnly>
        }
      />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
