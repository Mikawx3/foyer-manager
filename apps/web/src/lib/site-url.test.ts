import { describe, expect, it } from "vitest";
import { canonicalUrlForPath, isPublicSiteHost, PUBLIC_SITE_ORIGIN } from "./site-url.ts";

describe("canonicalUrlForPath", () => {
  it("keeps a trailing slash on the home page", () => {
    expect(canonicalUrlForPath("/")).toBe(`${PUBLIC_SITE_ORIGIN}/`);
  });

  it("appends a public path without a trailing slash", () => {
    expect(canonicalUrlForPath("/use/couple")).toBe(`${PUBLIC_SITE_ORIGIN}/use/couple`);
  });
});

describe("isPublicSiteHost", () => {
  it("matches the public host only", () => {
    expect(isPublicSiteHost("allotwe.com")).toBe(true);
    expect(isPublicSiteHost("localhost")).toBe(false);
  });
});
