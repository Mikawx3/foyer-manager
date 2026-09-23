import { describe, expect, it } from "vitest";
import { resolvePublicHome } from "./public-entry.ts";

describe("resolvePublicHome", () => {
  it("opens the app in local mode", () => {
    expect(resolvePublicHome(true, false)).toBe("app");
  });

  it("opens the app when a session exists", () => {
    expect(resolvePublicHome(false, true)).toBe("app");
  });

  it("shows the landing page before sign-in in cloud mode", () => {
    expect(resolvePublicHome(false, false)).toBe("landing");
  });
});
