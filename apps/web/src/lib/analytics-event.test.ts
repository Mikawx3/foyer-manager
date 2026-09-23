import { describe, expect, it } from "vitest";
import { redactAnalyticsEvent } from "./analytics-event.ts";

const HOUSEHOLD_ID = "clh3z8k0a0000qzrmn831i7rn";

describe("redactAnalyticsEvent", () => {
  it("replaces the household id and drops query and hash", () => {
    const result = redactAnalyticsEvent({
      type: "pageview",
      url: `https://app.example/households/${HOUSEHOLD_ID}/expenses?month=2026-09&categoryId=clcat123#details`,
    });

    expect(result).toEqual({
      type: "pageview",
      url: "https://app.example/households/[id]/expenses",
    });
  });

  it("keeps nested household routes grouped", () => {
    const result = redactAnalyticsEvent({
      type: "pageview",
      url: `https://app.example/households/${HOUSEHOLD_ID}/settings/members`,
    });

    expect(result?.url).toBe("https://app.example/households/[id]/settings/members");
  });

  it("leaves static household routes unchanged", () => {
    expect(
      redactAnalyticsEvent({
        type: "pageview",
        url: "https://app.example/households",
      })?.url,
    ).toBe("https://app.example/households");

    expect(
      redactAnalyticsEvent({
        type: "pageview",
        url: "https://app.example/households/new",
      })?.url,
    ).toBe("https://app.example/households/new");
  });

  it("drops the event when the url cannot be parsed", () => {
    expect(
      redactAnalyticsEvent({
        type: "event",
        url: "not a url",
      }),
    ).toBeNull();
  });
});
