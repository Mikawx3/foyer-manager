import { describe, expect, it } from "vitest";
import {
  alternateUrls,
  localizePath,
  normalizeLocale,
  parsePublicPath,
  prerenderTargets,
  PUBLIC_PATHS,
} from "./public-routes.ts";

describe("parsePublicPath", () => {
  it("treats bare paths as French", () => {
    expect(parsePublicPath("/")).toEqual({ locale: "fr", path: "/" });
    expect(parsePublicPath("/use/couple")).toEqual({ locale: "fr", path: "/use/couple" });
    expect(parsePublicPath("/help")).toEqual({ locale: "fr", path: "/help" });
  });

  it("treats /en paths as English", () => {
    expect(parsePublicPath("/en")).toEqual({ locale: "en", path: "/" });
    expect(parsePublicPath("/en/")).toEqual({ locale: "en", path: "/" });
    expect(parsePublicPath("/en/use/roommates")).toEqual({ locale: "en", path: "/use/roommates" });
  });

  it("ignores trailing slashes, query strings and hashes", () => {
    expect(parsePublicPath("/privacy/")).toEqual({ locale: "fr", path: "/privacy" });
    expect(parsePublicPath("/privacy#cookies")).toEqual({ locale: "fr", path: "/privacy" });
    expect(parsePublicPath("/en/help?x=1")).toEqual({ locale: "en", path: "/help" });
  });

  it("returns null for app routes and unknown pages", () => {
    expect(parsePublicPath("/households")).toBeNull();
    expect(parsePublicPath("/households/new")).toBeNull();
    expect(parsePublicPath("/login")).toBeNull();
    expect(parsePublicPath("/en/login")).toBeNull();
    expect(parsePublicPath("/use/unknown")).toBeNull();
    expect(parsePublicPath("/english")).toBeNull();
  });
});

describe("localizePath", () => {
  it("leaves French paths bare", () => {
    expect(localizePath("/", "fr")).toBe("/");
    expect(localizePath("/use/couple", "fr")).toBe("/use/couple");
    expect(localizePath("/en/use/couple", "fr")).toBe("/use/couple");
  });

  it("prefixes English paths", () => {
    expect(localizePath("/", "en")).toBe("/en");
    expect(localizePath("/use/couple", "en")).toBe("/en/use/couple");
    expect(localizePath("/en/help", "en")).toBe("/en/help");
  });

  it("keeps hashes and query strings", () => {
    expect(localizePath("/privacy#cookies", "en")).toBe("/en/privacy#cookies");
    expect(localizePath("/en/privacy#cookies", "fr")).toBe("/privacy#cookies");
    expect(localizePath("/help?x=1", "en")).toBe("/en/help?x=1");
  });

  it("returns app routes unchanged", () => {
    expect(localizePath("/households/new", "en")).toBe("/households/new");
    expect(localizePath("/login", "en")).toBe("/login");
  });
});

describe("alternateUrls", () => {
  it("builds absolute URLs with x-default on the English version", () => {
    expect(alternateUrls("/use/couple", "https://allotwe.com/")).toEqual({
      fr: "https://allotwe.com/use/couple",
      en: "https://allotwe.com/en/use/couple",
      xDefault: "https://allotwe.com/en/use/couple",
    });
    expect(alternateUrls("/", "https://allotwe.com")).toEqual({
      fr: "https://allotwe.com/",
      en: "https://allotwe.com/en",
      xDefault: "https://allotwe.com/en",
    });
  });
});

describe("normalizeLocale", () => {
  it("maps language tags to fr or en", () => {
    expect(normalizeLocale("fr")).toBe("fr");
    expect(normalizeLocale("fr-FR")).toBe("fr");
    expect(normalizeLocale("en-US")).toBe("en");
    expect(normalizeLocale("de")).toBe("en");
    expect(normalizeLocale(undefined)).toBe("en");
  });
});

describe("prerenderTargets", () => {
  it("lists every public page in both languages", () => {
    const targets = prerenderTargets();
    expect(targets).toHaveLength(PUBLIC_PATHS.length * 2);
    expect(targets.map((target) => target.url)).toContain("/");
    expect(targets.map((target) => target.url)).toContain("/en");
    expect(targets.map((target) => target.url)).toContain("/en/use/bills");
    expect(new Set(targets.map((target) => target.url)).size).toBe(targets.length);
  });
});
