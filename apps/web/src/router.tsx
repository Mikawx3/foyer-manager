import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout.tsx";
import { HouseholdDetailPage } from "./pages/HouseholdDetailPage.tsx";
import { HouseholdWizardPage } from "./pages/HouseholdWizardPage.tsx";
import { HouseholdsPage } from "./pages/HouseholdsPage.tsx";
import { BalancesPage } from "./pages/BalancesPage.tsx";
import { DashboardPage } from "./pages/DashboardPage.tsx";
import { ExpensesPage } from "./pages/ExpensesPage.tsx";
import { SettingsPage } from "./pages/SettingsPage.tsx";
import { NotFoundPage } from "./pages/NotFoundPage.tsx";
import { TenantsPage } from "./pages/TenantsPage.tsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/households" replace /> },
      { path: "households", element: <HouseholdsPage /> },
      { path: "households/new", element: <HouseholdWizardPage /> },
      {
        path: "households/:id",
        element: <HouseholdDetailPage />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: "dashboard", element: <DashboardPage /> },
          { path: "tenants", element: <TenantsPage /> },
          { path: "expenses", element: <ExpensesPage /> },
          { path: "balances", element: <BalancesPage /> },
          { path: "settings", element: <SettingsPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
