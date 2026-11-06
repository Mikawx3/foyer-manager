export const DEFAULT_PUBLIC_SITE_ORIGIN = "https://allotwe.com";

export function resolvePublicSiteOrigin(configured: string | undefined): string {
  const trimmed = configured?.trim() ?? "";
  return /^https?:\/\//.test(trimmed) ? trimmed.replace(/\/+$/, "") : DEFAULT_PUBLIC_SITE_ORIGIN;
}

export const PUBLIC_SITE_ORIGIN = resolvePublicSiteOrigin(import.meta.env.VITE_PUBLIC_SITE_ORIGIN);

export function canonicalUrlForPath(pathname: string): string {
  if (pathname === "/" || pathname.length === 0) {
    return `${PUBLIC_SITE_ORIGIN}/`;
  }
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${PUBLIC_SITE_ORIGIN}${normalized}`;
}

export function isPublicSiteHost(hostname: string): boolean {
  return hostname === new URL(PUBLIC_SITE_ORIGIN).hostname;
}
