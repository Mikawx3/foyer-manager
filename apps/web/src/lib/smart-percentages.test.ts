import { describe, expect, it } from "vitest";
import {
  applyPercentageChange,
  areCustomPercentagesValid,
  getPercentageTotalLabel,
  isPercentageTotalComplete,
  maxPercentageForKey,
  roundPercentageOneDecimal,
  safePercentage,
  totalFromValues,
} from "./smart-percentages.ts";

describe("smart-percentages", () => {
  it("roundPercentageOneDecimal rounds to one decimal", () => {
    expect(roundPercentageOneDecimal(33.333)).toBe(33.3);
    expect(roundPercentageOneDecimal(66.666)).toBe(66.7);
  });

  it("maxPercentageForKey caps based on other inputs", () => {
    const values = { a: 60, b: 25 };
    expect(maxPercentageForKey(values, "a", ["a", "b"])).toBe(75);
    expect(maxPercentageForKey(values, "b", ["a", "b"])).toBe(40);
  });

  it("applyPercentageChange syncs second member when two members and first changes", () => {
    const result = applyPercentageChange({ a: 50, b: 50 }, ["a", "b"], "a", 70);
    expect(result).toEqual({ a: 70, b: 30 });
  });

  it("applyPercentageChange syncs first member when two members and second changes", () => {
    const result = applyPercentageChange({ a: 50, b: 50 }, ["a", "b"], "b", 25);
    expect(result).toEqual({ a: 75, b: 25 });
  });

  it("applyPercentageChange clamps when more than two members", () => {
    const values = { a: 50, b: 30, c: 10 };
    const result = applyPercentageChange(values, ["a", "b", "c"], "a", 95);
    expect(result.a).toBe(60);
    expect(result.b).toBe(30);
    expect(result.c).toBe(10);
  });

  it("isPercentageTotalComplete allows small tolerance", () => {
    expect(isPercentageTotalComplete(100)).toBe(true);
    expect(isPercentageTotalComplete(99.97)).toBe(true);
    expect(isPercentageTotalComplete(85)).toBe(false);
  });

  it("getPercentageTotalLabel returns amber for under 100", () => {
    const label = getPercentageTotalLabel(85);
    expect(label.text).toBe("Total: 85% — 15% remaining");
    expect(label.className).toBe("text-amber-600");
  });

  it("getPercentageTotalLabel returns emerald for exactly 100", () => {
    const label = getPercentageTotalLabel(100);
    expect(label.text).toBe("Total: 100% ✓");
    expect(label.className).toBe("text-emerald-600");
  });

  it("getPercentageTotalLabel returns red for over 100", () => {
    const label = getPercentageTotalLabel(105);
    expect(label.text).toBe("Total: 105% — over by 5%");
    expect(label.className).toBe("text-red-500");
  });

  it("safePercentage replaces NaN and non-finite values with 0", () => {
    expect(safePercentage(Number.NaN)).toBe(0);
    expect(safePercentage(Number.POSITIVE_INFINITY)).toBe(0);
    expect(safePercentage(50)).toBe(50);
  });

  it("isPercentageTotalComplete returns false for non-finite totals", () => {
    expect(isPercentageTotalComplete(Number.NaN)).toBe(false);
  });

  it("totalFromValues treats NaN entries as 0", () => {
    expect(totalFromValues({ a: Number.NaN, b: 100 }, ["a", "b"])).toBe(100);
  });

  it("areCustomPercentagesValid rejects non-finite values even when sanitized total is 100", () => {
    expect(areCustomPercentagesValid({ a: Number.NaN, b: 100 }, ["a", "b"])).toBe(false);
    expect(areCustomPercentagesValid({ a: 0, b: 100 }, ["a", "b"])).toBe(true);
  });
});
