import { describe, expect, it } from "vitest";
import type { Prisma } from "@prisma/client";
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

    expect(where).toEqual({
      AND: [
        { householdId: "clh12345678901234567890123" },
        { categoryId: "clc12345678901234567890123" },
        {
          date: {
            gte: new Date(2026, 5, 1),
            lt: new Date(2026, 6, 1),
          },
        },
      ],
    });
  });

  it("adds search OR filter for description, payer and exact amount", () => {
    const where = buildExpenseListWhere({
      householdId: "clh12345678901234567890123",
      month: "2026-06",
      search: "12.50",
    });

    expect(where.AND).toBeDefined();
    const andClauses = where.AND as Prisma.ExpenseWhereInput[];
    const searchClause = andClauses.find((clause) => clause.OR !== undefined);
    expect(searchClause?.OR).toHaveLength(3);
  });
});
