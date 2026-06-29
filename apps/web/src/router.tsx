import { createBrowserRouter, Navigate } from "react-router-dom";
import { AuthGate } from "./components/auth/AuthGate.tsx";
import { CloudAuthRoute } from "./components/deployment/CloudAuthRoute.tsx";
import { AppLayout } from "./components/layout/AppLayout.tsx";
import { SettingsLayout } from "./components/settings/SettingsLayout.tsx";
import { HouseholdDetailPage } from "./pages/HouseholdDetailPage.tsx";
import { HouseholdWizardPage } from "./pages/HouseholdWizardPage.tsx";
import { HouseholdsPage } from "./pages/HouseholdsPage.tsx";
import { LoginPage } from "./pages/LoginPage.tsx";
import { RegisterPage } from "./pages/RegisterPage.tsx";
import { BalancesPage } from "./pages/BalancesPage.tsx";
import { DashboardPage } from "./pages/DashboardPage.tsx";
import { ExpensesPage } from "./pages/ExpensesPage.tsx";
import { IncomePage } from "./pages/IncomePage.tsx";
import { CategoriesSettingsPage } from "./pages/CategoriesSettingsPage.tsx";
import { SettingsPage } from "./pages/SettingsPage.tsx";
import { NotFoundPage } from "./pages/NotFoundPage.tsx";
import { TenantsPage } from "./pages/TenantsPage.tsx";

export const router = createBrowserRouter([
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
    path: "/",
    element: <AuthGate />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/households" replace /> },
          { path: "households", element: <HouseholdsPage /> },
          { path: "households/new", element: <HouseholdWizardPage mode="create" /> },
          {
            path: "households/:id/onboarding",
            element: <HouseholdWizardPage mode="setup" />,
          },
          {
            path: "households/:id",
            element: <HouseholdDetailPage />,
            children: [
              { index: true, element: <Navigate to="dashboard" replace /> },
              { path: "dashboard", element: <DashboardPage /> },
              { path: "tenants", element: <Navigate to="settings/members" replace /> },
              { path: "expenses", element: <ExpensesPage /> },
              { path: "income", element: <IncomePage /> },
              { path: "balances", element: <BalancesPage /> },
              {
                path: "settings",
                element: <SettingsLayout />,
                children: [
                  { index: true, element: <SettingsPage /> },
                  { path: "members", element: <TenantsPage /> },
                  { path: "categories", element: <CategoriesSettingsPage /> },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
