import { inputClassName } from "./FormField.tsx";
import {
  applyPercentageChange,
  getPercentageTotalLabel,
  isPercentageTotalComplete,
  maxPercentageForKey,
  roundPercentageOneDecimal,
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
  const keys = items.map((item) => item.id);
  const total = totalFromValues(values, keys);
  const totalLabel = getPercentageTotalLabel(total);
  const isComplete = isPercentageTotalComplete(total);

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {items.map((item, index) => {
          const max = maxPercentageForKey(values, item.id, keys);
          const isSecondOfTwo = items.length === 2 && index === 1;

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
                  value={values[item.id] ?? 0}
                  readOnly={isSecondOfTwo}
                  aria-readonly={isSecondOfTwo}
                  onChange={(event) => {
                    const raw = event.target.value === "" ? 0 : Number(event.target.value);
                    onChange(applyPercentageChange(values, keys, item.id, raw));
                  }}
                  onBlur={(event) => {
                    const raw = event.target.value === "" ? 0 : Number(event.target.value);
                    const next = applyPercentageChange(values, keys, item.id, raw);
                    const rounded = roundPercentageOneDecimal(next[item.id] ?? 0);
                    onChange({ ...next, [item.id]: rounded });
                  }}
                  onFocus={(event) => event.target.select()}
                />
                <span className="text-sm text-stone-500">%</span>
              </div>
            </li>
          );
        })}
      </ul>
      <p className={`text-sm ${totalLabel.className}`} aria-live="polite">
        {totalLabel.text}
      </p>
      {!isComplete && (
        <p className="sr-only">Percentages must total 100% before saving</p>
      )}
    </div>
  );
}

export { isPercentageTotalComplete, totalFromValues };
