import { describe, expect, it } from "vitest";
import { getNextDueDate } from "./next-due-date.ts";

describe("getNextDueDate", () => {
  it("advances weekly by 7 days", () => {
    const current = new Date("2026-06-01T00:00:00.000Z");
    expect(getNextDueDate(current, "weekly")).toEqual(new Date("2026-06-08T00:00:00.000Z"));
  });

  it("advances monthly by one month", () => {
    const current = new Date("2026-06-15T00:00:00.000Z");
    expect(getNextDueDate(current, "monthly")).toEqual(new Date("2026-07-15T00:00:00.000Z"));
  });

  it("advances quarterly by three months", () => {
    const current = new Date("2026-01-10T00:00:00.000Z");
    expect(getNextDueDate(current, "quarterly")).toEqual(new Date("2026-04-10T00:00:00.000Z"));
  });

  it("advances yearly by one year", () => {
    const current = new Date("2026-03-01T00:00:00.000Z");
    expect(getNextDueDate(current, "yearly")).toEqual(new Date("2027-03-01T00:00:00.000Z"));
  });
});
