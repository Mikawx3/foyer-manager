import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout.tsx";
import { HouseholdDetailPage } from "./pages/HouseholdDetailPage.tsx";
import { HouseholdsPage } from "./pages/HouseholdsPage.tsx";
import { BalancesPage } from "./pages/BalancesPage.tsx";
import { ExpensesPage } from "./pages/ExpensesPage.tsx";
import { TenantsPage } from "./pages/TenantsPage.tsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/households" replace /> },
      { path: "households", element: <HouseholdsPage /> },
      {
        path: "households/:id",
        element: <HouseholdDetailPage />,
        children: [
          { index: true, element: <Navigate to="tenants" replace /> },
          { path: "tenants", element: <TenantsPage /> },
          { path: "expenses", element: <ExpensesPage /> },
          { path: "balances", element: <BalancesPage /> },
        ],
      },
    ],
  },
]);
