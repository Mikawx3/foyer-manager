import { describe, expect, it } from "vitest";
import { formatMemberEmail, isPlaceholderMemberEmail } from "./member-email.ts";

describe("isPlaceholderMemberEmail", () => {
  it("returns true for auto-generated member emails", () => {
    expect(
      isPlaceholderMemberEmail("7b82d616-1624-4b9b-9ec8-eca79ea7464b@members.foyer.local"),
    ).toBe(true);
  });

  it("returns false for real emails", () => {
    expect(isPlaceholderMemberEmail("alice@example.com")).toBe(false);
  });
});

describe("formatMemberEmail", () => {
  it("returns null for placeholder emails", () => {
    expect(formatMemberEmail("uuid@members.foyer.local")).toBeNull();
  });

  it("returns the email for real addresses", () => {
    expect(formatMemberEmail("bob@example.com")).toBe("bob@example.com");
  });
});
