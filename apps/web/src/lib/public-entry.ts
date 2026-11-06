export type PublicHomeTarget = "app" | "landing";

/** Without a config response the deployment mode is unknown, so the public landing is the safe default. */
export function resolvePublicHome(
  isLocalMode: boolean,
  hasSession: boolean,
  configAvailable = true,
): PublicHomeTarget {
  if (!configAvailable) {
    return "landing";
  }
  if (isLocalMode || hasSession) {
    return "app";
  }
  return "landing";
}

/**
 * Sign-in and "create a household" links on public pages. They are shown
 * until the deployment is known to be local (no accounts), so the first
 * client render matches the prerendered HTML.
 */
export function showPublicAuthLinks(
  isLoading: boolean,
  isConfigError: boolean,
  isLocalMode: boolean,
): boolean {
  return isLoading || isConfigError || !isLocalMode;
}
