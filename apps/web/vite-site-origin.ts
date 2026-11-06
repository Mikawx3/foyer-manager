/**
 * Absolute origin of the public site at build time, used for `og:image` in
 * the SPA shell. The prerender script (scripts/prerender.mjs) applies the
 * same rule for canonical URLs, hreflang and the sitemap.
 *
 * Order: `VITE_PUBLIC_SITE_ORIGIN`, then the Vercel production domain, else none.
 */
export function resolveBuildSiteOrigin(env: Record<string, string | undefined>): string | null {
  const configured = env.VITE_PUBLIC_SITE_ORIGIN?.trim();
  if (configured && /^https?:\/\//.test(configured)) {
    return configured.replace(/\/+$/, "");
  }
  const vercelDomain = env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelDomain) {
    return `https://${vercelDomain.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;
  }
  return null;
}
