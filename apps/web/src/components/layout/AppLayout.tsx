import { Link, Outlet } from "react-router-dom";
import { AppLogo } from "../brand/AppLogo.tsx";
import { UserMenu } from "./UserMenu.tsx";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            to="/households"
            className="flex items-center gap-3 rounded-lg transition hover:opacity-90"
          >
            <AppLogo />
            <span className="text-lg font-semibold tracking-tight text-stone-900">
              Foyer Manager
            </span>
          </Link>
          <UserMenu />
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
