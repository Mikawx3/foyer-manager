import type { SplitMode } from "@foyer/types";
import { useTranslation } from "react-i18next";

interface SplitModeBadgeProps {
  splitMode: SplitMode;
}

export function SplitModeBadge({ splitMode }: SplitModeBadgeProps) {
  const { t } = useTranslation("common");
  const isDefault = splitMode === "default";

  return (
    <span
      className={
        isDefault
          ? "inline-flex rounded-full bg-stone-200 px-2 py-0.5 text-xs font-medium text-stone-700"
          : "inline-flex rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800"
      }
    >
      {isDefault ? t("defaultSplit") : t("customSplit")}
    </span>
  );
}
