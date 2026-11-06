import type { ComponentType } from "react";
import { Navigate, Outlet, ScrollRestoration, type RouteObject } from "react-router-dom";
import { CloudAuthRoute } from "./components/deployment/CloudAuthRoute.tsx";
import { PublicLocaleLayout } from "./components/layout/PublicLocaleLayout.tsx";
import { ListSkeleton } from "./components/ui/Skeleton.tsx";
import { routeTitle } from "./lib/document-title.ts";
import { AccessibilityPage } from "./pages/AccessibilityPage.tsx";
import { ComparePage } from "./pages/ComparePage.tsx";
import { HelpPage } from "./pages/HelpPage.tsx";
import { HomePage } from "./pages/HomePage.tsx";
import { LegalNoticePage } from "./pages/LegalNoticePage.tsx";
import { NotFoundPage } from "./pages/NotFoundPage.tsx";
import { PrivacyPage } from "./pages/PrivacyPage.tsx";
import { TermsPage } from "./pages/TermsPage.tsx";
import { UseCasePage } from "./pages/UseCasePage.tsx";

function RootLayout() {
  return (
    <>
      <Outlet />
      <ScrollRestoration />
    </>
  );
}

function RouteFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <ListSkeleton rows={2} />
    </div>
  );
}

type LazyRoute = NonNullable<RouteObject["lazy"]>;

/** App screens load on demand so the public pages ship a small bundle. */
function lazyRoute<Module>(
  load: () => Promise<Module>,
  pick: (module: Module) => ComponentType,
): LazyRoute {
  return async () => ({ Component: pick(await load()) });
}

function withCloudAuth(Page: ComponentType): ComponentType {
  return function CloudAuthPage() {
    return (
      <CloudAuthRoute>
        <Page />
      </CloudAuthRoute>
    );
  };
}

/** Public, prerendered pages. Mounted once per language (see PublicLocaleLayout). */
const publicPages: RouteObject[] = [
  { index: true, element: <HomePage /> },
  { path: "privacy", element: <PrivacyPage /> },
  { path: "legal", element: <LegalNoticePage /> },
  { path: "terms", element: <TermsPage /> },
  { path: "help", element: <HelpPage /> },
  { path: "accessibility", element: <AccessibilityPage /> },
  { path: "compare", element: <ComparePage /> },
  { path: "use/:useCaseId", element: <UseCasePage /> },
];

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    hydrateFallbackElement: <RouteFallback />,
    children: [
      { path: "/", element: <PublicLocaleLayout locale="fr" />, children: publicPages },
      { path: "/en", element: <PublicLocaleLayout locale="en" />, children: publicPages },
      {
        path: "/invite/:token",
        lazy: lazyRoute(
          () => import("./pages/InvitePage.tsx"),
          (module) => withCloudAuth(module.InvitePage),
        ),
      },
      {
        path: "/login",
        lazy: lazyRoute(
          () => import("./pages/LoginPage.tsx"),
          (module) => withCloudAuth(module.LoginPage),
        ),
      },
      {
        path: "/register",
        lazy: lazyRoute(
          () => import("./pages/RegisterPage.tsx"),
          (module) => withCloudAuth(module.RegisterPage),
        ),
      },
      {
        lazy: lazyRoute(
          () => import("./components/auth/AuthGate.tsx"),
          (module) => module.AuthGate,
        ),
        children: [
          {
            lazy: lazyRoute(
              () => import("./components/layout/AppLayout.tsx"),
              (module) => module.AppLayout,
            ),
            children: [
              {
                path: "households",
                lazy: lazyRoute(
                  () => import("./pages/HouseholdsPage.tsx"),
                  (module) => module.HouseholdsPage,
                ),
                handle: routeTitle("households", "title"),
              },
              {
                path: "households/new",
                lazy: lazyRoute(
                  () => import("./pages/HouseholdWizardPage.tsx"),
                  (module) =>
                    function CreateHouseholdRoute() {
                      return <module.HouseholdWizardPage mode="create" />;
                    },
                ),
                handle: routeTitle("common", "newHousehold"),
              },
              {
                path: "households/:id/onboarding",
                lazy: lazyRoute(
                  () => import("./pages/HouseholdWizardPage.tsx"),
                  (module) =>
                    function SetupHouseholdRoute() {
                      return <module.HouseholdWizardPage mode="setup" />;
                    },
                ),
                handle: routeTitle("households", "setupTitle"),
              },
              {
                path: "households/:id",
                lazy: lazyRoute(
                  () => import("./pages/HouseholdDetailPage.tsx"),
                  (module) => module.HouseholdDetailPage,
                ),
                handle: routeTitle("dashboard", "title"),
                children: [
                  { index: true, element: <Navigate to="dashboard" replace /> },
                  {
                    path: "dashboard",
                    lazy: lazyRoute(
                      () => import("./pages/DashboardPage.tsx"),
                      (module) => module.DashboardPage,
                    ),
                    handle: routeTitle("dashboard", "title"),
                  },
                  { path: "tenants", element: <Navigate to="settings/members" replace /> },
                  {
                    path: "expenses",
                    lazy: lazyRoute(
                      () => import("./pages/ExpensesPage.tsx"),
                      (module) => module.ExpensesPage,
                    ),
                    handle: routeTitle("expenses", "title"),
                  },
                  {
                    path: "income",
                    lazy: lazyRoute(
                      () => import("./pages/IncomePage.tsx"),
                      (module) => module.IncomePage,
                    ),
                    handle: routeTitle("income", "title"),
                  },
                  {
                    path: "balances",
                    lazy: lazyRoute(
                      () => import("./pages/BalancesPage.tsx"),
                      (module) => module.BalancesPage,
                    ),
                    handle: routeTitle("balances", "title"),
                  },
                  {
                    path: "settings",
                    lazy: lazyRoute(
                      () => import("./components/settings/SettingsLayout.tsx"),
                      (module) => module.SettingsLayout,
                    ),
                    handle: routeTitle("settings", "title"),
                    children: [
                      {
                        index: true,
                        lazy: lazyRoute(
                          () => import("./pages/SettingsPage.tsx"),
                          (module) => module.SettingsPage,
                        ),
                        handle: routeTitle("settings", "title"),
                      },
                      {
                        path: "members",
                        lazy: lazyRoute(
                          () => import("./pages/TenantsPage.tsx"),
                          (module) => module.TenantsPage,
                        ),
                        handle: routeTitle("nav", "manageMembers"),
                      },
                      {
                        path: "categories",
                        lazy: lazyRoute(
                          () => import("./pages/CategoriesSettingsPage.tsx"),
                          (module) => module.CategoriesSettingsPage,
                        ),
                        handle: routeTitle("nav", "categories"),
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
];
