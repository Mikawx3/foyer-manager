/**
 * Public (indexable) pages and their localized URLs.
 *
 * French is served on the bare paths (`/`, `/use/couple`), English under `/en`.
 * The URL is the source of truth for the language on these pages.
 */

export const PUBLIC_LOCALES = ["fr", "en"] as const;

export type PublicLocale = (typeof PUBLIC_LOCALES)[number];

export const DEFAULT_PUBLIC_LOCALE: PublicLocale = "fr";

/** Locale served under a URL prefix. `x-default` points to this version. */
export const PREFIXED_PUBLIC_LOCALE: PublicLocale = "en";

const LOCALE_PREFIX = `/${PREFIXED_PUBLIC_LOCALE}`;

export const USE_CASE_IDS = ["couple", "roommates", "solo", "bills"] as const;

export type UseCaseId = (typeof USE_CASE_IDS)[number];

export const PUBLIC_PATHS = [
  "/",
  "/use/couple",
  "/use/roommates",
  "/use/solo",
  "/use/bills",
  "/compare",
  "/help",
  "/privacy",
  "/legal",
  "/terms",
  "/accessibility",
] as const;

export type PublicPath = (typeof PUBLIC_PATHS)[number];

export interface ParsedPublicPath {
  locale: PublicLocale;
  /** Locale-free path, always starting with `/`. */
  path: PublicPath;
}

export interface PrerenderTarget {
  locale: PublicLocale;
  path: PublicPath;
  /** Localized URL path, e.g. `/en/use/couple`. */
  url: string;
}

export function isPublicLocale(value: string | undefined): value is PublicLocale {
  return PUBLIC_LOCALES.some((locale) => locale === value);
}

export function isPublicPath(value: string): value is PublicPath {
  return PUBLIC_PATHS.some((path) => path === value);
}

export function isUseCaseId(value: string | undefined): value is UseCaseId {
  return USE_CASE_IDS.some((id) => id === value);
}

/** Maps any i18next language tag (`fr-FR`, `en-US`, `en`) to a public locale. */
export function normalizeLocale(language: string | undefined): PublicLocale {
  return language?.toLowerCase().startsWith("fr") ? "fr" : "en";
}

function splitSuffix(target: string): { pathname: string; suffix: string } {
  const match = /^([^?#]*)(.*)$/.exec(target);
  return { pathname: match?.[1] ?? target, suffix: match?.[2] ?? "" };
}

function stripLocalePrefix(pathname: string): { locale: PublicLocale; pathname: string } {
  if (pathname === LOCALE_PREFIX) {
    return { locale: PREFIXED_PUBLIC_LOCALE, pathname: "/" };
  }
  if (pathname.startsWith(`${LOCALE_PREFIX}/`)) {
    return { locale: PREFIXED_PUBLIC_LOCALE, pathname: pathname.slice(LOCALE_PREFIX.length) };
  }
  return { locale: DEFAULT_PUBLIC_LOCALE, pathname };
}

function trimTrailingSlash(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

/**
 * Returns the locale and locale-free path of a public URL, or `null` when the
 * pathname is not a public page (app routes, login, unknown pages).
 */
export function parsePublicPath(pathname: string): ParsedPublicPath | null {
  const { pathname: bare } = splitSuffix(pathname);
  const normalized = trimTrailingSlash(bare.length === 0 ? "/" : bare);
  const { locale, pathname: localeFree } = stripLocalePrefix(normalized);
  if (!isPublicPath(localeFree)) {
    return null;
  }
  return { locale, path: localeFree };
}

/**
 * Prefixes a public path with the locale segment when needed. Query strings
 * and hashes are preserved. Non-public paths (app routes) are returned as-is,
 * so it is safe to wrap every internal link.
 */
export function localizePath(target: string, locale: PublicLocale): string {
  const { pathname, suffix } = splitSuffix(target);
  const { pathname: localeFree } = stripLocalePrefix(trimTrailingSlash(pathname || "/"));
  if (!isPublicPath(localeFree)) {
    return target;
  }
  if (locale === DEFAULT_PUBLIC_LOCALE) {
    return `${localeFree}${suffix}`;
  }
  const prefixed = localeFree === "/" ? LOCALE_PREFIX : `${LOCALE_PREFIX}${localeFree}`;
  return `${prefixed}${suffix}`;
}

export interface AlternateUrls {
  fr: string;
  en: string;
  xDefault: string;
}

/** Absolute URLs of every language version of a public page, for `hreflang`. */
export function alternateUrls(path: PublicPath, siteOrigin: string): AlternateUrls {
  const origin = siteOrigin.replace(/\/+$/, "");
  const fr = `${origin}${localizePath(path, "fr")}`;
  const en = `${origin}${localizePath(path, "en")}`;
  return { fr, en, xDefault: PREFIXED_PUBLIC_LOCALE === "en" ? en : fr };
}

/** Every page and language to prerender at build time. */
export function prerenderTargets(): PrerenderTarget[] {
  return PUBLIC_LOCALES.flatMap((locale) =>
    PUBLIC_PATHS.map((path) => ({ locale, path, url: localizePath(path, locale) })),
  );
}
