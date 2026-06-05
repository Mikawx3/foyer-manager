import { useQuery } from "@tanstack/react-query";
import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import { useDeploymentMode } from "../../hooks/useDeploymentMode.ts";
import { ErrorMessage } from "../ui/ErrorMessage.tsx";
import { ListSkeleton } from "../ui/Skeleton.tsx";
import { getApiErrorMessage, getMe, getTenants } from "../../lib/api.ts";
import { getToken } from "../../lib/auth-storage.ts";
import { queryKeys } from "../../lib/query-keys.ts";

function isOnboardingPath(pathname: string, householdId: string): boolean {
  return pathname === `/households/${householdId}/onboarding`;
}

function isHouseholdsHubPath(pathname: string): boolean {
  return pathname === "/households";
}

export function AuthGate() {
  const location = useLocation();
  const { id: routeHouseholdId } = useParams<{ id: string }>();
  const { isLocalMode, isLoading: isConfigLoading } = useDeploymentMode();
  const token = getToken();

  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: getMe,
    enabled: !isLocalMode && Boolean(token),
    retry: false,
  });

  const householdId = isLocalMode ? (routeHouseholdId ?? "") : (meQuery.data?.householdId ?? "");

  const tenantsQuery = useQuery({
    queryKey: queryKeys.tenants(householdId),
    queryFn: () => getTenants(householdId),
    enabled: Boolean(householdId) && (isLocalMode || meQuery.isSuccess),
  });

  if (isConfigLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <ListSkeleton rows={2} />
      </div>
    );
  }

  if (!isLocalMode && !token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!isLocalMode && meQuery.isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <ListSkeleton rows={2} />
      </div>
    );
  }

  if (!isLocalMode && meQuery.isError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <ErrorMessage
          message={getApiErrorMessage(meQuery.error)}
          onRetry={() => meQuery.refetch()}
        />
      </div>
    );
  }

  if (
    !isLocalMode &&
    routeHouseholdId &&
    meQuery.data &&
    routeHouseholdId !== meQuery.data.householdId
  ) {
    const suffix = location.pathname.replace(/^\/households\/[^/]+/, "") || "/dashboard";
    return <Navigate to={`/households/${householdId}${suffix}`} replace />;
  }

  if (householdId && tenantsQuery.isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <ListSkeleton rows={2} />
      </div>
    );
  }

  if (
    householdId &&
    tenantsQuery.isSuccess &&
    !isHouseholdsHubPath(location.pathname) &&
    !isOnboardingPath(location.pathname, householdId)
  ) {
    const activeTenants = tenantsQuery.data.filter((tenant) => tenant.active);
    if (activeTenants.length === 0) {
      return <Navigate to={`/households/${householdId}/onboarding`} replace />;
    }
  }

  return <Outlet />;
}
