export const PUBLIC_SITE_ORIGIN = "https://allotwe.com";

const PUBLIC_SITE_HOST = "allotwe.com";

export function canonicalUrlForPath(pathname: string): string {
  if (pathname === "/" || pathname.length === 0) {
    return `${PUBLIC_SITE_ORIGIN}/`;
  }
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${PUBLIC_SITE_ORIGIN}${normalized}`;
}

export function isPublicSiteHost(hostname: string): boolean {
  return hostname === PUBLIC_SITE_HOST;
}
