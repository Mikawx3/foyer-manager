import { describe, expect, it } from "vitest";
import { shouldPromptGuestAccount } from "./guest-account-prompt.ts";

describe("shouldPromptGuestAccount", () => {
  const guest = {
    isGuest: true,
    dismissed: false,
    visitCount: 1,
    firstExpenseJustSaved: false,
  };

  it("stays quiet on the first visit before any expense", () => {
    expect(shouldPromptGuestAccount(guest)).toBe(false);
  });

  it("opens after the first expense", () => {
    expect(shouldPromptGuestAccount({ ...guest, firstExpenseJustSaved: true })).toBe(true);
  });

  it("opens on the second visit", () => {
    expect(shouldPromptGuestAccount({ ...guest, visitCount: 2 })).toBe(true);
  });

  it("stays closed after the sheet was dismissed this session", () => {
    expect(
      shouldPromptGuestAccount({ ...guest, visitCount: 2, dismissed: true, firstExpenseJustSaved: true }),
    ).toBe(false);
  });

  it("does not prompt an account", () => {
    expect(shouldPromptGuestAccount({ ...guest, isGuest: false, visitCount: 3 })).toBe(false);
  });
});
