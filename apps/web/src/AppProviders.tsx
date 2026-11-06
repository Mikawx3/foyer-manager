import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { AppToaster } from "./components/ui/AppToaster.tsx";
import { DocumentLang } from "./components/ui/DocumentLang.tsx";
import { DeploymentModeProvider } from "./contexts/DeploymentModeContext.tsx";

export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
      },
    },
  });
}

interface AppProvidersProps {
  queryClient: QueryClient;
  children: ReactNode;
}

/** Everything a routed page needs. Shared by the browser entry and the prerender entry. */
export function AppProviders({ queryClient, children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <DeploymentModeProvider>
        <DocumentLang />
        {children}
      </DeploymentModeProvider>
      <AppToaster />
    </QueryClientProvider>
  );
}
