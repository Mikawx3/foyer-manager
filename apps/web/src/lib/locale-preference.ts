import { isPublicLocale, type PublicLocale } from "./public-routes.ts";

/** Same key i18next-browser-languagedetector reads (`lookupLocalStorage`). */
export const LOCALE_STORAGE_KEY = "fm_locale";

interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function defaultStorage(): KeyValueStorage | null {
  return typeof localStorage === "undefined" ? null : localStorage;
}

/**
 * The language the user picked explicitly. Browser detection is never stored,
 * so an absent value means "follow the URL on public pages, the browser elsewhere".
 */
export function readStoredLocale(storage: KeyValueStorage | null = defaultStorage()): PublicLocale | null {
  const value = storage?.getItem(LOCALE_STORAGE_KEY) ?? undefined;
  return isPublicLocale(value) ? value : null;
}

export function storeLocale(locale: PublicLocale, storage: KeyValueStorage | null = defaultStorage()): void {
  storage?.setItem(LOCALE_STORAGE_KEY, locale);
}
