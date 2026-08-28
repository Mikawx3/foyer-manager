import { describe, expect, it } from "vitest";
import type { Prisma } from "@prisma/client";
import {
  buildExpenseListWhere,
  buildParticipantScopeWhere,
} from "./expense-list-filters.js";

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

  it("applies shared participant scope with household members", () => {
    const where = buildExpenseListWhere({
      householdId: "clh12345678901234567890123",
      participantScope: "shared",
      householdTenantIds: ["t1", "t2"],
    });

    expect(where).toEqual({
      AND: [
        { householdId: "clh12345678901234567890123" },
        {
          OR: [
            { splitMode: "default" },
            {
              AND: [
                { splitMode: "custom" },
                { splits: { some: { tenantId: "t1" } } },
                { splits: { some: { tenantId: "t2" } } },
              ],
            },
          ],
        },
      ],
    });
  });

  it("applies personal participant scope", () => {
    const where = buildExpenseListWhere({
      householdId: "clh12345678901234567890123",
      participantScope: "personal",
      householdTenantIds: ["t1", "t2"],
    });

    expect(where).toEqual({
      AND: [
        { householdId: "clh12345678901234567890123" },
        {
          AND: [
            { splitMode: "custom" },
            {
              OR: [
                { splits: { none: { tenantId: "t1" } } },
                { splits: { none: { tenantId: "t2" } } },
              ],
            },
          ],
        },
      ],
    });
  });
});

describe("buildParticipantScopeWhere", () => {
  it("returns null for all scope or solo households", () => {
    expect(buildParticipantScopeWhere("all", ["t1", "t2"])).toBeNull();
    expect(buildParticipantScopeWhere("shared", ["t1"])).toBeNull();
    expect(buildParticipantScopeWhere("personal", [])).toBeNull();
  });
});
