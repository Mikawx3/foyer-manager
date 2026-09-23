import { describe, expect, it } from "vitest";
import { DEFAULT_APP_NAME, formatDocumentTitle, getAppName, resolveAppName } from "./app-name.ts";

describe("resolveAppName", () => {
  it("uses the repository name when none is configured", () => {
    expect(resolveAppName(undefined)).toBe(DEFAULT_APP_NAME);
    expect(resolveAppName("  ")).toBe(DEFAULT_APP_NAME);
  });

  it("prefers a configured display name", () => {
    expect(resolveAppName(" Allotwe ")).toBe("Allotwe");
  });
});

describe("formatDocumentTitle", () => {
  it("keeps the app name alone when the page has no other title", () => {
    expect(formatDocumentTitle("")).toBe(getAppName());
    expect(formatDocumentTitle(`  ${getAppName()}  `)).toBe(getAppName());
  });

  it("puts the page name before the app name", () => {
    expect(formatDocumentTitle("Dashboard")).toBe(`Dashboard — ${getAppName()}`);
  });
});
