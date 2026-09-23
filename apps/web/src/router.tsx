import { createBrowserRouter, Navigate, Outlet, ScrollRestoration } from "react-router-dom";
import { AuthGate } from "./components/auth/AuthGate.tsx";
import { CloudAuthRoute } from "./components/deployment/CloudAuthRoute.tsx";
import { AppLayout } from "./components/layout/AppLayout.tsx";
import { SettingsLayout } from "./components/settings/SettingsLayout.tsx";
import { HouseholdDetailPage } from "./pages/HouseholdDetailPage.tsx";
import { HouseholdWizardPage } from "./pages/HouseholdWizardPage.tsx";
import { HouseholdsPage } from "./pages/HouseholdsPage.tsx";
import { AccessibilityPage } from "./pages/AccessibilityPage.tsx";
import { HelpPage } from "./pages/HelpPage.tsx";
import { HomePage } from "./pages/HomePage.tsx";
import { InvitePage } from "./pages/InvitePage.tsx";
import { LegalNoticePage } from "./pages/LegalNoticePage.tsx";
import { LoginPage } from "./pages/LoginPage.tsx";
import { PrivacyPage } from "./pages/PrivacyPage.tsx";
import { TermsPage } from "./pages/TermsPage.tsx";
import { UseCasePage } from "./pages/UseCasePage.tsx";
import { RegisterPage } from "./pages/RegisterPage.tsx";
import { BalancesPage } from "./pages/BalancesPage.tsx";
import { DashboardPage } from "./pages/DashboardPage.tsx";
import { ExpensesPage } from "./pages/ExpensesPage.tsx";
import { IncomePage } from "./pages/IncomePage.tsx";
import { CategoriesSettingsPage } from "./pages/CategoriesSettingsPage.tsx";
import { SettingsPage } from "./pages/SettingsPage.tsx";
import { NotFoundPage } from "./pages/NotFoundPage.tsx";
import { TenantsPage } from "./pages/TenantsPage.tsx";
import { routeTitle } from "./lib/document-title.ts";

function RootLayout() {
  return (
    <>
      <Outlet />
      <ScrollRestoration />
    </>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
  { path: "/", element: <HomePage /> },
  { path: "/privacy", element: <PrivacyPage /> },
  { path: "/legal", element: <LegalNoticePage /> },
  { path: "/terms", element: <TermsPage /> },
  { path: "/help", element: <HelpPage /> },
  { path: "/accessibility", element: <AccessibilityPage /> },
  { path: "/use/:useCaseId", element: <UseCasePage /> },
  {
    path: "/invite/:token",
    element: (
      <CloudAuthRoute>
        <InvitePage />
      </CloudAuthRoute>
    ),
  },
  {
    path: "/login",
    element: (
      <CloudAuthRoute>
        <LoginPage />
      </CloudAuthRoute>
    ),
  },
  {
    path: "/register",
    element: (
      <CloudAuthRoute>
        <RegisterPage />
      </CloudAuthRoute>
    ),
  },
  {
    element: <AuthGate />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "households", element: <HouseholdsPage />, handle: routeTitle("households", "title") },
          {
            path: "households/new",
            element: <HouseholdWizardPage mode="create" />,
            handle: routeTitle("common", "newHousehold"),
          },
          {
            path: "households/:id/onboarding",
            element: <HouseholdWizardPage mode="setup" />,
            handle: routeTitle("households", "setupTitle"),
          },
          {
            path: "households/:id",
            element: <HouseholdDetailPage />,
            handle: routeTitle("dashboard", "title"),
            children: [
              { index: true, element: <Navigate to="dashboard" replace /> },
              { path: "dashboard", element: <DashboardPage />, handle: routeTitle("dashboard", "title") },
              { path: "tenants", element: <Navigate to="settings/members" replace /> },
              { path: "expenses", element: <ExpensesPage />, handle: routeTitle("expenses", "title") },
              { path: "income", element: <IncomePage />, handle: routeTitle("income", "title") },
              { path: "balances", element: <BalancesPage />, handle: routeTitle("balances", "title") },
              {
                path: "settings",
                element: <SettingsLayout />,
                handle: routeTitle("settings", "title"),
                children: [
                  { index: true, element: <SettingsPage />, handle: routeTitle("settings", "title") },
                  { path: "members", element: <TenantsPage />, handle: routeTitle("nav", "manageMembers") },
                  {
                    path: "categories",
                    element: <CategoriesSettingsPage />,
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
]);
