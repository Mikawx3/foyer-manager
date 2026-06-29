import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFormat } from "../../hooks/useFormat.ts";
import { formatMonthLabel } from "../../lib/income-stats.ts";
import { iconBtn } from "../../lib/ui-classes.ts";

interface MonthNavigatorProps {
  month: string;
  onChange: (month: string) => void;
}

export function MonthNavigator({ month, onChange }: MonthNavigatorProps) {
  const { t: tCommon } = useTranslation("common");
  const { locale } = useFormat();

  const shift = (delta: number) => {
    const [yearStr, monthStr] = month.split("-");
    let year = Number(yearStr);
    let monthIndex = Number(monthStr) - 1 + delta;
    while (monthIndex < 0) {
      monthIndex += 12;
      year -= 1;
    }
    while (monthIndex > 11) {
      monthIndex -= 12;
      year += 1;
    }
    onChange(`${year}-${String(monthIndex + 1).padStart(2, "0")}`);
  };

  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 py-2 shadow-sm">
      <button
        type="button"
        className={iconBtn}
        onClick={() => shift(-1)}
        aria-label={tCommon("previous")}
      >
        <ChevronLeft className="h-5 w-5" aria-hidden />
      </button>
      <p className="text-center text-sm font-semibold text-stone-900 md:text-base">
        {formatMonthLabel(month, locale)}
      </p>
      <button
        type="button"
        className={iconBtn}
        onClick={() => shift(1)}
        aria-label={tCommon("next")}
      >
        <ChevronRight className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );
}
