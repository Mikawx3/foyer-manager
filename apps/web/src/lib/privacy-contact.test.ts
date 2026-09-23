import { describe, expect, it } from "vitest";
import {
  DEFAULT_PRIVACY_CONTACT_EMAIL,
  normalizePrivacyContactEmail,
  resolvePrivacyContactEmail,
} from "./privacy-contact.ts";

describe("normalizePrivacyContactEmail", () => {
  it("returns null when the address is missing or blank", () => {
    expect(normalizePrivacyContactEmail(undefined)).toBeNull();
    expect(normalizePrivacyContactEmail("   ")).toBeNull();
  });

  it("trims a published address", () => {
    expect(normalizePrivacyContactEmail("  privacy@example.com  ")).toBe("privacy@example.com");
  });
});

describe("resolvePrivacyContactEmail", () => {
  it("uses the public address when none is configured", () => {
    expect(resolvePrivacyContactEmail(undefined)).toBe(DEFAULT_PRIVACY_CONTACT_EMAIL);
    expect(resolvePrivacyContactEmail("  ")).toBe(DEFAULT_PRIVACY_CONTACT_EMAIL);
  });

  it("prefers a configured address", () => {
    expect(resolvePrivacyContactEmail(" privacy@example.com ")).toBe("privacy@example.com");
  });
});
