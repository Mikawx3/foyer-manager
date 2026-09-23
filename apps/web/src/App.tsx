import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { AppToaster } from "./components/ui/AppToaster.tsx";
import { DocumentLang } from "./components/ui/DocumentLang.tsx";
import { ErrorBoundary } from "./components/ui/ErrorBoundary.tsx";
import { DeploymentModeProvider } from "./contexts/DeploymentModeContext.tsx";
import { router } from "./router.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <DeploymentModeProvider>
          <DocumentLang />
          <RouterProvider router={router} />
        </DeploymentModeProvider>
        <AppToaster />
      </QueryClientProvider>
      <Analytics />
    </ErrorBoundary>
  );
}
