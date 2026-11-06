import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { localizePath, normalizeLocale, parsePublicPath, type PublicLocale } from "../lib/public-routes.ts";

/** Locale of the current public page, or the interface language inside the app. */
export function usePublicLocale(): PublicLocale {
  const { pathname } = useLocation();
  const { i18n } = useTranslation();
  return parsePublicPath(pathname)?.locale ?? normalizeLocale(i18n.language);
}

/** Returns a function that localizes internal links to public pages (`/help` -> `/en/help`). */
export function useLocalizePath(): (target: string) => string {
  const locale = usePublicLocale();
  return useCallback((target: string) => localizePath(target, locale), [locale]);
}
