import { useTranslation } from "react-i18next";
import type { ParticipantScope } from "../../lib/expense-list-filters.ts";

interface ParticipantScopeToggleProps {
  value: ParticipantScope;
  onChange: (value: ParticipantScope) => void;
}

const OPTIONS: ParticipantScope[] = ["shared", "personal", "all"];

export function ParticipantScopeToggle({ value, onChange }: ParticipantScopeToggleProps) {
  const { t } = useTranslation("expenses");

  return (
    <div
      className="inline-flex rounded-lg border border-border bg-stone-100 p-0.5"
      role="group"
      aria-label={t("participantScopeLabel")}
    >
      {OPTIONS.map((option) => {
        const selected = value === option;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              selected
                ? "bg-surface text-stone-900 shadow-sm"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            {t(`participantScope.${option}`)}
          </button>
        );
      })}
    </div>
  );
}
