import { describe, expect, it } from "vitest";
import { formatCurrency, formatDate } from "./format.ts";

describe("formatCurrency", () => {
  it("formats EUR in en-US locale", () => {
    expect(formatCurrency(1704.3, "en-US")).toBe("€1,704.30");
  });

  it("formats EUR in fr-FR locale", () => {
    const formatted = formatCurrency(1704.3, "fr-FR");
    expect(formatted).toContain("1");
    expect(formatted).toContain("704");
    expect(formatted).toContain("30");
    expect(formatted).toContain("€");
  });
});

describe("formatDate", () => {
  it("formats long date in en-US locale", () => {
    expect(formatDate("2026-06-05", "en-US")).toBe("June 5, 2026");
  });

  it("formats long date in fr-FR locale", () => {
    const formatted = formatDate("2026-06-05", "fr-FR");
    expect(formatted).toContain("2026");
    expect(formatted.toLowerCase()).toMatch(/juin|5/);
  });
});
