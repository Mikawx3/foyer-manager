import { describe, expect, it } from "vitest";
import { buildExpenseListWhere } from "./expense-list-filters.js";

describe("buildExpenseListWhere", () => {
  it("filters by household only when no optional filters", () => {
    const where = buildExpenseListWhere({ householdId: "clh12345678901234567890123" });
    expect(where).toEqual({ householdId: "clh12345678901234567890123" });
  });

  it("adds categoryId and month date range", () => {
    const where = buildExpenseListWhere({
      householdId: "clh12345678901234567890123",
      categoryId: "clc12345678901234567890123",
      month: "2026-06",
    });

    expect(where.householdId).toBe("clh12345678901234567890123");
    expect(where.categoryId).toBe("clc12345678901234567890123");
    expect(where.date).toEqual({
      gte: new Date(2026, 5, 1),
      lt: new Date(2026, 6, 1),
    });
  });
});
