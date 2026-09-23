export type PublicHomeTarget = "app" | "landing";

export function resolvePublicHome(isLocalMode: boolean, hasSession: boolean): PublicHomeTarget {
  if (isLocalMode || hasSession) {
    return "app";
  }
  return "landing";
}
