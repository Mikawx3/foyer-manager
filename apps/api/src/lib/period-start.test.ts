import { describe, expect, it } from "vitest";
import { getPeriodStart } from "./period-start.ts";

describe("getPeriodStart", () => {
  it("returns null for none", () => {
    expect(getPeriodStart("none")).toBeNull();
  });

  it("returns first day of current month for monthly", () => {
    const now = new Date("2026-06-15T12:00:00.000Z");
    expect(getPeriodStart("monthly", now)).toEqual(new Date("2026-06-01T00:00:00.000Z"));
  });

  it("returns first day of current quarter for quarterly", () => {
    const now = new Date("2026-05-15T12:00:00.000Z");
    expect(getPeriodStart("quarterly", now)).toEqual(new Date("2026-04-01T00:00:00.000Z"));
  });

  it("returns Jan 1 for yearly", () => {
    const now = new Date("2026-11-15T12:00:00.000Z");
    expect(getPeriodStart("yearly", now)).toEqual(new Date("2026-01-01T00:00:00.000Z"));
  });
});
