import { describe, expect, it } from "vitest";
import {
  evaluateAmountExpression,
  formatAmountForInput,
  hasAmountExpression,
} from "./evaluate-amount-expression.ts";

describe("evaluateAmountExpression", () => {
  it("parses plain numbers", () => {
    expect(evaluateAmountExpression("12.5")).toBe(12.5);
    expect(evaluateAmountExpression("  42 ")).toBe(42);
  });

  it("evaluates arithmetic expressions", () => {
    expect(evaluateAmountExpression("12+8")).toBe(20);
    expect(evaluateAmountExpression("100/4")).toBe(25);
    expect(evaluateAmountExpression("10.5*2")).toBe(21);
    expect(evaluateAmountExpression("50 - 12.5")).toBe(37.5);
    expect(evaluateAmountExpression("(12+8)*2")).toBe(40);
  });

  it("rejects invalid or unsafe input", () => {
    expect(evaluateAmountExpression("")).toBeNull();
    expect(evaluateAmountExpression("12+")).toBeNull();
    expect(evaluateAmountExpression("abc")).toBeNull();
    expect(evaluateAmountExpression("12/0")).toBeNull();
    expect(evaluateAmountExpression("-5")).toBeNull();
    expect(evaluateAmountExpression("0")).toBeNull();
  });
});

describe("hasAmountExpression", () => {
  it("detects operators in expressions", () => {
    expect(hasAmountExpression("12+8")).toBe(true);
    expect(hasAmountExpression("12.5")).toBe(false);
    expect(hasAmountExpression("10-3")).toBe(true);
  });
});

describe("formatAmountForInput", () => {
  it("formats finite numbers and handles NaN", () => {
    expect(formatAmountForInput(12.5)).toBe("12.5");
    expect(formatAmountForInput(Number.NaN)).toBe("");
  });
});
