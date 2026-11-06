import { describe, expect, it } from "vitest";
import { resolvePublicHome, showPublicAuthLinks } from "./public-entry.ts";

describe("showPublicAuthLinks", () => {
  it("shows the links while the config loads and in cloud mode", () => {
    expect(showPublicAuthLinks(true, false, true)).toBe(true);
    expect(showPublicAuthLinks(false, false, false)).toBe(true);
  });

  it("shows the links when the config failed to load", () => {
    expect(showPublicAuthLinks(false, true, true)).toBe(true);
  });

  it("hides the links once the deployment is known to be local", () => {
    expect(showPublicAuthLinks(false, false, true)).toBe(false);
  });
});

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

  it("shows the landing page when the API config could not be loaded", () => {
    expect(resolvePublicHome(true, false, false)).toBe("landing");
    expect(resolvePublicHome(true, true, false)).toBe("landing");
  });
});
