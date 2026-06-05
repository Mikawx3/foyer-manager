import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import en from "../messages/en.json";
import fr from "../messages/fr.json";

const namespaces = Object.keys(en) as Array<keyof typeof en>;

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
    fallbackLng: "en",
    supportedLngs: ["en", "fr"],
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "fm_locale",
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
