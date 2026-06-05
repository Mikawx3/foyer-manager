import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
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
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              fontFamily: "Plus Jakarta Sans, sans-serif",
              fontSize: "14px",
            },
          }}
        />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
