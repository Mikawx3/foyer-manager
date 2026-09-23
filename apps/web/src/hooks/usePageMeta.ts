import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getAppName } from "../lib/app-name.ts";
import { canonicalUrlForPath, isPublicSiteHost } from "../lib/site-url.ts";

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

export function usePageMeta(title: string, description?: string): void {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = title;
    if (description) {
      upsertMeta("name", "description", description);
      upsertMeta("property", "og:title", title);
      upsertMeta("property", "og:description", description);
      upsertMeta("name", "twitter:title", title);
      upsertMeta("name", "twitter:description", description);
    }
    if (isPublicSiteHost(window.location.hostname)) {
      const canonical = canonicalUrlForPath(pathname);
      upsertCanonical(canonical);
      upsertMeta("property", "og:url", canonical);
    }
    return () => {
      document.title = getAppName();
    };
  }, [title, description, pathname]);
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
