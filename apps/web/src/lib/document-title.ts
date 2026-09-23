export interface RouteTitle {
  titleNs: string;
  titleKey: string;
}

export function routeTitle(titleNs: string, titleKey: string): RouteTitle {
  return { titleNs, titleKey };
}

export function readRouteTitle(handle: unknown): RouteTitle | null {
  if (typeof handle !== "object" || handle === null) {
    return null;
  }
  if (!("titleNs" in handle) || !("titleKey" in handle)) {
    return null;
  }
  const { titleNs, titleKey } = handle;
  if (typeof titleNs !== "string" || typeof titleKey !== "string") {
    return null;
  }
  if (titleNs.length === 0 || titleKey.length === 0) {
    return null;
  }
  return { titleNs, titleKey };
}
