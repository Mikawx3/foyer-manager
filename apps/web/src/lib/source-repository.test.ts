import { describe, expect, it } from "vitest";
import { DEFAULT_SOURCE_REPOSITORY_URL, resolveSourceRepositoryUrl } from "./source-repository.ts";

describe("resolveSourceRepositoryUrl", () => {
  it("uses the upstream repository when nothing is configured", () => {
    expect(resolveSourceRepositoryUrl(undefined)).toBe(DEFAULT_SOURCE_REPOSITORY_URL);
    expect(resolveSourceRepositoryUrl("  ")).toBe(DEFAULT_SOURCE_REPOSITORY_URL);
  });

  it("prefers a configured fork URL", () => {
    expect(resolveSourceRepositoryUrl(" https://git.example.com/me/fork ")).toBe(
      "https://git.example.com/me/fork",
    );
  });

  it("ignores values that are not http links", () => {
    expect(resolveSourceRepositoryUrl("javascript:alert(1)")).toBe(DEFAULT_SOURCE_REPOSITORY_URL);
  });
});
