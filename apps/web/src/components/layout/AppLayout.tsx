import { Outlet } from "react-router-dom";
import { CloudOnly } from "../deployment/CloudOnly.tsx";
import { AppHeader } from "./AppHeader.tsx";
import { UserMenu } from "./UserMenu.tsx";

export function AppLayout() {
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
