import { RouterProvider } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { AppProviders, createAppQueryClient } from "./AppProviders.tsx";
import { ErrorBoundary } from "./components/ui/ErrorBoundary.tsx";
import { redactAnalyticsEvent } from "./lib/analytics-event.ts";
import { router } from "./router.tsx";

const queryClient = createAppQueryClient();

export default function App() {
  return (
    <ErrorBoundary>
      <AppProviders queryClient={queryClient}>
        <RouterProvider router={router} />
      </AppProviders>
      <Analytics beforeSend={redactAnalyticsEvent} />
    </ErrorBoundary>
  );
}
