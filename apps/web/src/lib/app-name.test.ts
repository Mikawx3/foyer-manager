import { describe, expect, it } from "vitest";
import { DEFAULT_APP_NAME, resolveAppName } from "./app-name.ts";

describe("resolveAppName", () => {
  it("uses the repository name when none is configured", () => {
    expect(resolveAppName(undefined)).toBe(DEFAULT_APP_NAME);
    expect(resolveAppName("  ")).toBe(DEFAULT_APP_NAME);
  });

  it("prefers a configured display name", () => {
    expect(resolveAppName(" Allotwe ")).toBe("Allotwe");
  });
});
