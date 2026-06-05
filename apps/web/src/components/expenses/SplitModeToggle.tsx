import { useTranslation } from "react-i18next";

interface SplitModeToggleProps {
  useAutoSplit: boolean;
  onChange: (useAutoSplit: boolean) => void;
}

export function SplitModeToggle({ useAutoSplit, onChange }: SplitModeToggleProps) {
  const { t } = useTranslation("common");

  return (
    <div
      className="inline-flex rounded-lg border border-border bg-stone-100 p-0.5"
      role="group"
      aria-label={t("splitMode")}
    >
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
          useAutoSplit
            ? "bg-surface text-stone-900 shadow-sm"
            : "text-stone-600 hover:text-stone-900"
        }`}
      >
        {t("autoSplit")}
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
          !useAutoSplit
            ? "bg-surface text-stone-900 shadow-sm"
            : "text-stone-600 hover:text-stone-900"
        }`}
      >
        {t("customize")}
      </button>
    </div>
  );
}
