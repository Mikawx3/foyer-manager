import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { btnSecondary } from "../../lib/ui-classes.ts";

interface LanguageSwitcherProps {
  compact?: boolean;
}

export function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation("settings");
  const current = i18n.language.startsWith("fr") ? "fr" : "en";

  const setLanguage = (lang: "en" | "fr") => {
    void i18n.changeLanguage(lang);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Languages className="h-4 w-4 shrink-0 text-stone-500" strokeWidth={2} aria-hidden />
        <div className="flex gap-1" role="group" aria-label={t("languageSwitcherLabel")}>
          <button
            type="button"
            onClick={() => setLanguage("en")}
            className={`rounded px-2 py-1 text-xs font-medium transition ${
              current === "en"
                ? "bg-stone-900 text-white"
                : "text-stone-600 hover:bg-stone-100"
            }`}
            aria-pressed={current === "en"}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLanguage("fr")}
            className={`rounded px-2 py-1 text-xs font-medium transition ${
              current === "fr"
                ? "bg-stone-900 text-white"
                : "text-stone-600 hover:bg-stone-100"
            }`}
            aria-pressed={current === "fr"}
          >
            FR
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2" role="group" aria-label={t("languageSwitcherLabel")}>
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`${btnSecondary} ${current === "en" ? "ring-2 ring-stone-900" : ""}`}
        aria-pressed={current === "en"}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage("fr")}
        className={`${btnSecondary} ${current === "fr" ? "ring-2 ring-stone-900" : ""}`}
        aria-pressed={current === "fr"}
      >
        FR
      </button>
    </div>
  );
}
