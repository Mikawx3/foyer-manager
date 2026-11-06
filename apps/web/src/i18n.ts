import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import en from "../messages/en.json";
import fr from "../messages/fr.json";
import { getAppName } from "./lib/app-name.ts";
import { LOCALE_STORAGE_KEY } from "./lib/locale-preference.ts";
import { parsePublicPath } from "./lib/public-routes.ts";

const namespaces = Object.keys(en) as Array<keyof typeof en>;

/** On a public page the URL decides the language, so the first render matches the prerendered HTML. */
function initialLanguageFromUrl(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  return parsePublicPath(window.location.pathname)?.locale;
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: Object.fromEntries(namespaces.map((ns) => [ns, en[ns]])),
      fr: Object.fromEntries(namespaces.map((ns) => [ns, fr[ns]])),
    },
    ns: namespaces,
    defaultNS: "common",
    lng: initialLanguageFromUrl(),
    fallbackLng: "en",
    supportedLngs: ["en", "fr"],
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: LOCALE_STORAGE_KEY,
      // Only an explicit choice is stored (see LanguageSwitcher); detection is never cached.
      caches: [],
    },
    interpolation: {
      escapeValue: false,
      defaultVariables: {
        appName: getAppName(),
      },
    },
  });

export default i18n;
