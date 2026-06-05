import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useDeploymentMode } from "../../contexts/DeploymentModeContext.tsx";

export function CloudAuthRoute({ children }: { children: ReactNode }) {
  const { isLocalMode, isLoading } = useDeploymentMode();

  if (isLoading) {
    return null;
  }

  if (isLocalMode) {
    return <Navigate to="/households" replace />;
  }

  return children;
}
