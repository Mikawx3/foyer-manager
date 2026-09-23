import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { DeploymentMode } from "@foyer/types";
import { getConfig } from "../lib/api.ts";
import { clearAuth } from "../lib/auth-storage.ts";
import { queryKeys } from "../lib/query-keys.ts";

interface DeploymentModeContextValue {
  deploymentMode: DeploymentMode;
  googleClientId: string | null;
  isLocalMode: boolean;
  isCloudMode: boolean;
  isLoading: boolean;
}

const DeploymentModeContext = createContext<DeploymentModeContextValue | null>(null);

export function DeploymentModeProvider({ children }: { children: ReactNode }) {
  const configQuery = useQuery({
    queryKey: queryKeys.config,
    queryFn: getConfig,
    staleTime: Infinity,
  });

  const deploymentMode: DeploymentMode = configQuery.data?.deploymentMode ?? "local";

  useEffect(() => {
    if (configQuery.data?.deploymentMode === "local") {
      clearAuth();
    }
  }, [configQuery.data?.deploymentMode]);

  const value: DeploymentModeContextValue = {
    deploymentMode,
    googleClientId: configQuery.data?.googleClientId ?? null,
    isLocalMode: deploymentMode === "local",
    isCloudMode: deploymentMode === "cloud",
    isLoading: configQuery.isLoading,
  };

  return (
    <DeploymentModeContext.Provider value={value}>{children}</DeploymentModeContext.Provider>
  );
}

export function useDeploymentMode(): DeploymentModeContextValue {
  const context = useContext(DeploymentModeContext);
  if (!context) {
    throw new Error("useDeploymentMode must be used within DeploymentModeProvider");
  }
  return context;
}
