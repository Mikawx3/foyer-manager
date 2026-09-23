import { Outlet } from "react-router-dom";
import { CloudOnly } from "../deployment/CloudOnly.tsx";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.ts";
import { getAppName } from "../../lib/app-name.ts";
import { AppHeader } from "./AppHeader.tsx";
import { UserMenu } from "./UserMenu.tsx";

export function AppLayout() {
  useDocumentTitle(getAppName());

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
