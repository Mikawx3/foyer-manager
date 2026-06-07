import { useTranslation } from "react-i18next";
import { inputClassName } from "./FormField.tsx";
import {
  applyPercentageChange,
  areCustomPercentagesValid,
  isPercentageTotalComplete,
  maxPercentageForKey,
  roundPercentageOneDecimal,
  safePercentage,
  totalFromValues,
} from "../../lib/smart-percentages.ts";

export interface SmartPercentageItem {
  id: string;
  label: string;
}

interface SmartPercentageInputsProps {
  items: SmartPercentageItem[];
  values: Record<string, number>;
  onChange: (values: Record<string, number>) => void;
}

export function SmartPercentageInputs({
  items,
  values,
  onChange,
}: SmartPercentageInputsProps) {
  const { t } = useTranslation("common");
  const keys = items.map((item) => item.id);
  const total = totalFromValues(values, keys);
  const isComplete = areCustomPercentagesValid(values, keys);
  const rounded = roundPercentageOneDecimal(total);

  let totalText: string;
  let totalClassName: string;
  if (isComplete) {
    totalText = t("totalComplete");
    totalClassName = "text-emerald-600";
  } else if (rounded < 100) {
    totalText = t("totalRemaining", {
      total: rounded,
      remaining: roundPercentageOneDecimal(100 - rounded),
    });
    totalClassName = "text-amber-600";
  } else {
    totalText = t("totalOver", {
      total: rounded,
      over: roundPercentageOneDecimal(rounded - 100),
    });
    totalClassName = "text-red-500";
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {items.map((item) => {
          const max = maxPercentageForKey(values, item.id, keys);

          return (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-stone-800">{item.label}</span>
              <div className="flex items-center gap-1">
                <input
                  className={`${inputClassName} w-24`}
                  type="number"
                  min={0}
                  max={max}
                  step={0.1}
                  value={safePercentage(values[item.id] ?? 0)}
                  onChange={(event) => {
                    const parsed = event.target.value === "" ? 0 : Number(event.target.value);
                    const raw = safePercentage(parsed);
                    onChange(applyPercentageChange(values, keys, item.id, raw));
                  }}
                  onBlur={(event) => {
                    const parsed = event.target.value === "" ? 0 : Number(event.target.value);
                    const raw = safePercentage(parsed);
                    const next = applyPercentageChange(values, keys, item.id, raw);
                    const roundedValue = roundPercentageOneDecimal(next[item.id] ?? 0);
                    onChange({ ...next, [item.id]: roundedValue });
                  }}
                  onFocus={(event) => event.target.select()}
                />
                <span className="text-sm text-stone-500">{t("percentSymbol")}</span>
              </div>
            </li>
          );
        })}
      </ul>
      <p className={`text-sm ${totalClassName}`} aria-live="polite">
        {totalText}
      </p>
      {!isComplete && (
        <p className="sr-only">{t("percentagesMustTotal100BeforeSaving")}</p>
      )}
    </div>
  );
}

export {
  areCustomPercentagesValid,
  isPercentageTotalComplete,
  safePercentage,
  totalFromValues,
};
