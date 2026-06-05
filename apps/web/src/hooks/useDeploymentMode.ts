import { useQuery } from "@tanstack/react-query";
import type { DeploymentMode } from "@foyer/types";
import { getConfig } from "../lib/api.ts";
import { queryKeys } from "../lib/query-keys.ts";

export function useDeploymentMode(): {
  deploymentMode: DeploymentMode;
  isLocalMode: boolean;
  isCloudMode: boolean;
  isLoading: boolean;
} {
  const configQuery = useQuery({
    queryKey: queryKeys.config,
    queryFn: getConfig,
    staleTime: Number.POSITIVE_INFINITY,
  });

  const deploymentMode = configQuery.data?.deploymentMode ?? "cloud";

  return {
    deploymentMode,
    isLocalMode: deploymentMode === "local",
    isCloudMode: deploymentMode === "cloud",
    isLoading: configQuery.isLoading,
  };
}
