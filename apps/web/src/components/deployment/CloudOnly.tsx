import type { ReactNode } from "react";
import { useDeploymentMode } from "../../contexts/DeploymentModeContext.tsx";

export function CloudOnly({ children }: { children: ReactNode }) {
  const { isCloudMode, isLoading } = useDeploymentMode();

  if (isLoading || !isCloudMode) {
    return null;
  }

  return children;
}
