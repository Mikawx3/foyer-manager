import { createContext, useContext, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { getAppName } from "../lib/app-name.ts";
import { parsePublicPath } from "../lib/public-routes.ts";
import { buildSeoHead, serializeJsonLd, type FaqEntry, type SeoHead } from "../lib/seo-head.ts";
import { isPublicSiteHost, PUBLIC_SITE_ORIGIN } from "../lib/site-url.ts";

/**
 * During prerendering there is no DOM. Pages publish their head here and the
 * build script serializes it into the HTML template.
 */
export interface SeoHeadCollector {
  head: SeoHead | null;
  siteOrigin: string | null;
}

export const SeoHeadCollectorContext = createContext<SeoHeadCollector | null>(null);

function upsertMeta(attribute: "name" | "property", key: string, content: string): void {
  const existing = document.head.querySelector(`meta[${attribute}="${key}"]`);
  const element = existing instanceof HTMLMetaElement ? existing : document.createElement("meta");
  if (!(existing instanceof HTMLMetaElement)) {
    element.setAttribute(attribute, key);
    document.head.append(element);
  }
  element.setAttribute("content", content);
}

function removeMeta(attribute: "name" | "property", key: string): void {
  const existing = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (existing instanceof HTMLMetaElement) {
    existing.remove();
  }
}

function upsertCanonical(href: string): void {
  const existing = document.head.querySelector('link[rel="canonical"]');
  const element = existing instanceof HTMLLinkElement ? existing : document.createElement("link");
  if (!(existing instanceof HTMLLinkElement)) {
    element.rel = "canonical";
    document.head.append(element);
  }
  element.href = href;
}

function removeCanonical(): string | null {
  const existing = document.head.querySelector('link[rel="canonical"]');
  if (!(existing instanceof HTMLLinkElement)) {
    return null;
  }
  const href = existing.href;
  existing.remove();
  return href;
}

function replaceAlternates(head: SeoHead): void {
  for (const link of document.head.querySelectorAll('link[rel="alternate"][hreflang]')) {
    link.remove();
  }
  for (const alternate of head.alternates) {
    const link = document.createElement("link");
    link.rel = "alternate";
    link.hreflang = alternate.hrefLang;
    link.href = alternate.href;
    document.head.append(link);
  }
}

function replaceJsonLd(head: SeoHead): void {
  for (const script of document.head.querySelectorAll('script[type="application/ld+json"]')) {
    script.remove();
  }
  for (const data of head.jsonLd) {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-seo", "1");
    script.textContent = serializeJsonLd(data);
    document.head.append(script);
  }
}

/** Applies a head description to the live document. */
export function applySeoHead(head: SeoHead): void {
  document.title = head.title;
  document.documentElement.lang = head.lang;
  removeMeta("name", "robots");
  for (const tag of head.meta) {
    upsertMeta(tag.attribute, tag.key, tag.content);
  }
  if (head.canonical) {
    upsertCanonical(head.canonical);
  } else {
    removeCanonical();
    removeMeta("property", "og:url");
  }
  replaceAlternates(head);
  replaceJsonLd(head);
}

interface PageMetaOptions {
  faq?: FaqEntry[];
}

/**
 * Sets the document title and SEO tags of a public page. Canonical and
 * hreflang are only emitted on the public site host, so a self-hosted copy
 * never claims allotwe.com as its canonical.
 */
export function usePageMeta(title: string, description?: string, options?: PageMetaOptions): void {
  const { pathname } = useLocation();
  const collector = useContext(SeoHeadCollectorContext);
  const faqKey = JSON.stringify(options?.faq ?? null);

  const head = useMemo<SeoHead | null>(() => {
    const parsed = parsePublicPath(pathname);
    if (!parsed || !description) {
      return null;
    }
    const siteOrigin = collector
      ? collector.siteOrigin
      : typeof window !== "undefined" && isPublicSiteHost(window.location.hostname)
        ? PUBLIC_SITE_ORIGIN
        : null;
    const faq = JSON.parse(faqKey) as FaqEntry[] | null;
    return buildSeoHead({
      locale: parsed.locale,
      path: parsed.path,
      title,
      description,
      appName: getAppName(),
      siteOrigin,
      faq: faq ?? undefined,
    });
  }, [pathname, title, description, faqKey, collector]);

  if (collector && head) {
    collector.head = head;
  }

  useEffect(() => {
    if (head) {
      applySeoHead(head);
    } else {
      document.title = title;
    }
    return () => {
      document.title = getAppName();
    };
  }, [head, title]);
}

export function useNoIndex(): void {
  useEffect(() => {
    upsertMeta("name", "robots", "noindex, nofollow");
    const previousCanonical = removeCanonical();
    return () => {
      removeMeta("name", "robots");
      if (previousCanonical) {
        upsertCanonical(previousCanonical);
      }
    };
  }, []);
}
