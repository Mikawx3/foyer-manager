import type { SplitMode } from "@foyer/types";

interface SplitModeBadgeProps {
  splitMode: SplitMode;
}

export function SplitModeBadge({ splitMode }: SplitModeBadgeProps) {
  const isDefault = splitMode === "default";

  return (
    <span
      className={
        isDefault
          ? "inline-flex rounded-full bg-stone-200 px-2 py-0.5 text-xs font-medium text-stone-700"
          : "inline-flex rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800"
      }
    >
      {isDefault ? "Default split" : "Custom split"}
    </span>
  );
}
