import { describe, expect, it } from "vitest";
import { isValidRecurringDraft } from "./household-wizard-types.ts";

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
