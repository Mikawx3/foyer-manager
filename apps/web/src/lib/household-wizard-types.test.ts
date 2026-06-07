import { describe, expect, it } from "vitest";
import { isValidRecurringDraft, reconcileCustomSplits } from "./household-wizard-types.ts";

describe("isValidRecurringDraft", () => {
  it("returns true for a complete draft", () => {
    expect(
      isValidRecurringDraft({
        tempId: "1",
        title: "Rent",
        categoryName: "Rent",
        amount: 900,
        frequency: "monthly",
        startDate: "2026-06-01",
        paidByTempId: "m1",
      }),
    ).toBe(true);
  });

  it("returns false when amount is missing", () => {
    expect(
      isValidRecurringDraft({
        tempId: "1",
        title: "Rent",
        categoryName: "Rent",
        amount: Number.NaN,
        frequency: "monthly",
        startDate: "2026-06-01",
        paidByTempId: "m1",
      }),
    ).toBe(false);
  });

  it("returns false when title is empty", () => {
    expect(
      isValidRecurringDraft({
        tempId: "1",
        title: "   ",
        categoryName: "Rent",
        amount: 900,
        frequency: "monthly",
        startDate: "2026-06-01",
        paidByTempId: "m1",
      }),
    ).toBe(false);
  });
});

describe("reconcileCustomSplits", () => {
  it("preserves existing percentages for surviving members", () => {
    const members = [
      { tempId: "m1", name: "Alice", color: "#000" },
      { tempId: "m2", name: "Bob", color: "#111" },
    ];
    const customSplits = { m1: 70, m2: 30, m3: 50 };

    expect(reconcileCustomSplits(members, customSplits)).toEqual({ m1: 70, m2: 30 });
  });

  it("assigns equal split when a new member is added and removes orphan keys", () => {
    const members = [
      { tempId: "m1", name: "Alice", color: "#000" },
      { tempId: "m2", name: "Bob", color: "#111" },
      { tempId: "m3", name: "Charlie", color: "#222" },
    ];
    const customSplits = { m1: 70, m2: 30 };

    expect(reconcileCustomSplits(members, customSplits)).toEqual({ m1: 33, m2: 33, m3: 34 });
  });
});
