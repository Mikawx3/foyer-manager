import { describe, expect, it } from "vitest";
import { buildCategoryExpenseStats } from "./expense-stats.js";

describe("buildCategoryExpenseStats", () => {
  const categories = [
    {
      id: "cat-food",
      name: "Food",
      slug: "food",
      householdId: "hh1",
    },
    {
      id: "cat-rent",
      name: "Rent",
      slug: "rent",
      householdId: "hh1",
    },
  ];

  it("computes share percentages and sorts by amount descending", () => {
    const stats = buildCategoryExpenseStats(
      [
        { categoryId: "cat-food", amount: 200, expenseCount: 4 },
        { categoryId: "cat-rent", amount: 800, expenseCount: 1 },
      ],
      categories,
      1000,
    );

    expect(stats).toHaveLength(2);
    expect(stats[0]?.categorySlug).toBe("rent");
    expect(stats[0]?.sharePercent).toBe(80);
    expect(stats[1]?.sharePercent).toBe(20);
  });

  it("returns zero share when total expenses is zero", () => {
    const stats = buildCategoryExpenseStats(
      [{ categoryId: "cat-food", amount: 0, expenseCount: 0 }],
      categories,
      0,
    );

    expect(stats[0]?.sharePercent).toBe(0);
  });

  it("uses unknown slug when category is missing", () => {
    const stats = buildCategoryExpenseStats(
      [{ categoryId: "missing", amount: 50, expenseCount: 1 }],
      categories,
      50,
    );

    expect(stats[0]?.categorySlug).toBe("unknown");
  });
});
