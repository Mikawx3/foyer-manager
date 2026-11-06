import {
  alternateUrls,
  localizePath,
  type PublicLocale,
  type PublicPath,
} from "./public-routes.ts";

export interface FaqEntry {
  question: string;
  answer: string;
}

export interface SeoHeadInput {
  locale: PublicLocale;
  path: PublicPath;
  title: string;
  description: string;
  appName: string;
  /** Absolute origin of the public site. `null` disables canonical, hreflang and og:url. */
  siteOrigin: string | null;
  /** Questions and answers rendered as a `FAQPage` structured data block. */
  faq?: FaqEntry[];
}

export interface SeoMetaTag {
  attribute: "name" | "property";
  key: string;
  content: string;
}

export interface SeoAlternate {
  hrefLang: string;
  href: string;
}

export interface SeoHead {
  lang: PublicLocale;
  title: string;
  canonical: string | null;
  alternates: SeoAlternate[];
  meta: SeoMetaTag[];
  jsonLd: Record<string, unknown>[];
}

const OG_LOCALES: Record<PublicLocale, string> = { fr: "fr_FR", en: "en_US" };

function ogLocale(locale: PublicLocale): string {
  return OG_LOCALES[locale];
}

function otherLocale(locale: PublicLocale): PublicLocale {
  return locale === "fr" ? "en" : "fr";
}

function normalizeOrigin(origin: string): string {
  return origin.replace(/\/+$/, "");
}

function softwareApplicationJsonLd(input: SeoHeadInput, url: string | null): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: input.appName,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    ...(url ? { url } : {}),
    description: input.description,
    inLanguage: input.locale,
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
  };
}

function faqJsonLd(faq: FaqEntry[], locale: PublicLocale): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: locale,
    mainEntity: faq.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  };
}

/** Pure description of everything a public page puts in `<head>`. */
export function buildSeoHead(input: SeoHeadInput): SeoHead {
  const origin = input.siteOrigin ? normalizeOrigin(input.siteOrigin) : null;
  const canonical = origin ? `${origin}${localizePath(input.path, input.locale)}` : null;
  const alternates: SeoAlternate[] = [];
  if (origin) {
    const urls = alternateUrls(input.path, origin);
    alternates.push(
      { hrefLang: "fr", href: urls.fr },
      { hrefLang: "en", href: urls.en },
      { hrefLang: "x-default", href: urls.xDefault },
    );
  }

  const meta: SeoMetaTag[] = [
    { attribute: "name", key: "description", content: input.description },
    { attribute: "property", key: "og:type", content: "website" },
    { attribute: "property", key: "og:site_name", content: input.appName },
    { attribute: "property", key: "og:locale", content: ogLocale(input.locale) },
    { attribute: "property", key: "og:locale:alternate", content: ogLocale(otherLocale(input.locale)) },
    { attribute: "property", key: "og:title", content: input.title },
    { attribute: "property", key: "og:description", content: input.description },
    { attribute: "name", key: "twitter:card", content: "summary_large_image" },
    { attribute: "name", key: "twitter:title", content: input.title },
    { attribute: "name", key: "twitter:description", content: input.description },
  ];
  if (canonical) {
    meta.push({ attribute: "property", key: "og:url", content: canonical });
  }
  if (origin) {
    meta.push(
      { attribute: "property", key: "og:image", content: `${origin}/og.png` },
      { attribute: "name", key: "twitter:image", content: `${origin}/og.png` },
    );
  }

  const jsonLd: Record<string, unknown>[] = [];
  if (input.path === "/") {
    jsonLd.push(softwareApplicationJsonLd(input, canonical));
  }
  if (input.faq && input.faq.length > 0) {
    jsonLd.push(faqJsonLd(input.faq, input.locale));
  }

  return { lang: input.locale, title: input.title, canonical, alternates, meta, jsonLd };
}

export function escapeHtmlAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function escapeHtmlText(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

/** JSON safe to inline in a `<script>`: `<` cannot close the tag. */
export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replaceAll("<", "\\u003c");
}

/** Static `<head>` markup for prerendered pages (title excluded, handled by the template). */
export function renderSeoHeadHtml(head: SeoHead): string {
  const lines: string[] = [];
  for (const tag of head.meta) {
    lines.push(
      `<meta ${tag.attribute}="${escapeHtmlAttribute(tag.key)}" content="${escapeHtmlAttribute(tag.content)}" />`,
    );
  }
  if (head.canonical) {
    lines.push(`<link rel="canonical" href="${escapeHtmlAttribute(head.canonical)}" />`);
  }
  for (const alternate of head.alternates) {
    lines.push(
      `<link rel="alternate" hreflang="${escapeHtmlAttribute(alternate.hrefLang)}" href="${escapeHtmlAttribute(alternate.href)}" />`,
    );
  }
  for (const data of head.jsonLd) {
    lines.push(`<script type="application/ld+json" data-seo="1">${serializeJsonLd(data)}</script>`);
  }
  return lines.join("\n    ");
}
