import type { ReactNode } from "react";
import { useDeploymentMode } from "../../contexts/DeploymentModeContext.tsx";

export function LocalOnly({ children }: { children: ReactNode }) {
  const { isLocalMode, isLoading } = useDeploymentMode();

  if (isLoading || !isLocalMode) {
    return null;
  }

  return children;
}
