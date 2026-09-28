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
