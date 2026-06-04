import { sumPercentages } from "./split-percentages.ts";

const COMPLETE_TOLERANCE = 0.05;

export function roundPercentageOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

export function maxPercentageForKey(
  values: Record<string, number>,
  key: string,
  keys: string[],
): number {
  const otherSum = keys
    .filter((k) => k !== key)
    .reduce((sum, k) => sum + (values[k] ?? 0), 0);
  return Math.max(0, roundPercentageOneDecimal(100 - otherSum));
}

export function clampPercentage(value: number, max: number): number {
  const clamped = Math.min(Math.max(0, value), max);
  return roundPercentageOneDecimal(clamped);
}

export function applyPercentageChange(
  values: Record<string, number>,
  keys: string[],
  changedKey: string,
  rawValue: number,
): Record<string, number> {
  const next = { ...values };

  if (keys.length === 2) {
    const firstKey = keys[0];
    const secondKey = keys[1];
    if (firstKey === undefined || secondKey === undefined) {
      return next;
    }

    if (changedKey === firstKey) {
      const first = clampPercentage(rawValue, 100);
      next[firstKey] = first;
      next[secondKey] = clampPercentage(100 - first, 100);
      return next;
    }

    if (changedKey === secondKey) {
      const second = clampPercentage(rawValue, 100);
      next[secondKey] = second;
      next[firstKey] = clampPercentage(100 - second, 100);
      return next;
    }
  }

  const max = maxPercentageForKey(next, changedKey, keys);
  next[changedKey] = clampPercentage(rawValue, max);
  return next;
}

export function isPercentageTotalComplete(total: number): boolean {
  return Math.abs(total - 100) <= COMPLETE_TOLERANCE;
}

export interface PercentageTotalLabel {
  text: string;
  className: string;
}

export function getPercentageTotalLabel(total: number): PercentageTotalLabel {
  const rounded = roundPercentageOneDecimal(total);

  if (isPercentageTotalComplete(rounded)) {
    return {
      text: "Total: 100% ✓",
      className: "text-emerald-600",
    };
  }

  if (rounded < 100) {
    const remaining = roundPercentageOneDecimal(100 - rounded);
    return {
      text: `Total: ${rounded}% — ${remaining}% remaining`,
      className: "text-amber-600",
    };
  }

  const over = roundPercentageOneDecimal(rounded - 100);
  return {
    text: `Total: ${rounded}% — over by ${over}%`,
    className: "text-red-500",
  };
}

export function totalFromValues(values: Record<string, number>, keys: string[]): number {
  return roundPercentageOneDecimal(sumPercentages(keys.map((key) => values[key] ?? 0)));
}
