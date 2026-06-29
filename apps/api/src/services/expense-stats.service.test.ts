import { describe, expect, it, vi } from "vitest";
import { NotFoundError } from "../errors/app.errors.js";
import type { CategoryRepository } from "../repositories/category.repository.js";
import type { ExpenseRepository } from "../repositories/expense.repository.js";
import type { HouseholdRepository } from "../repositories/household.repository.js";
import { ExpenseStatsService } from "./expense-stats.service.js";

const householdId = "clh12345678901234567890123";
const categoryId = "clc12345678901234567890123";

function buildHouseholds(): HouseholdRepository {
  return {
    findById: vi.fn().mockResolvedValue({
      id: householdId,
      name: "Home",
      type: "shared",
      settlementPeriod: "none",
      createdAt: new Date(),
    }),
    findAll: vi.fn(),
    create: vi.fn(),
    updateById: vi.fn(),
    deleteById: vi.fn(),
  };
}

function buildExpenses(overrides: Partial<ExpenseRepository> = {}): ExpenseRepository {
  return {
    sumAmountByWhere: vi.fn().mockResolvedValue(1000),
    countByWhere: vi.fn().mockResolvedValue(3),
    findLargestExpenseByWhere: vi.fn().mockResolvedValue({
      description: "Groceries",
      amount: 500,
    }),
    groupByCategoryForWhere: vi.fn().mockResolvedValue([
      { categoryId, amount: 1000, expenseCount: 3 },
    ]),
    ...overrides,
  } as unknown as ExpenseRepository;
}

function buildCategories(): CategoryRepository {
  return {
    findAllByHousehold: vi.fn().mockResolvedValue([
      {
        id: categoryId,
        name: "Food",
        slug: "food",
        householdId,
      },
    ]),
    findById: vi.fn(),
    create: vi.fn(),
    createManyForHousehold: vi.fn(),
    deleteById: vi.fn(),
    countExpenses: vi.fn(),
  };
}

describe("ExpenseStatsService", () => {
  it("returns monthly stats with category breakdown and trend", async () => {
    const expenses = buildExpenses();
    const service = new ExpenseStatsService(
      expenses,
      buildCategories(),
      buildHouseholds(),
    );

    const stats = await service.getStatsForMonth(householdId, "2026-06");

    expect(stats.month).toBe("2026-06");
    expect(stats.totalExpenses).toBe(1000);
    expect(stats.expenseCount).toBe(3);
    expect(stats.largestExpense).toEqual({ description: "Groceries", amount: 500 });
    expect(stats.byCategory).toHaveLength(1);
    expect(stats.byCategory[0]?.sharePercent).toBe(100);
    expect(stats.trend).toHaveLength(6);
    expect(stats.trend[5]?.month).toBe("2026-06");
  });

  it("returns null largest expense when month is empty", async () => {
    const expenses = buildExpenses({
      sumAmountByWhere: vi.fn().mockResolvedValue(0),
      countByWhere: vi.fn().mockResolvedValue(0),
      findLargestExpenseByWhere: vi.fn().mockResolvedValue(null),
      groupByCategoryForWhere: vi.fn().mockResolvedValue([]),
    });
    const service = new ExpenseStatsService(
      expenses,
      buildCategories(),
      buildHouseholds(),
    );

    const stats = await service.getStatsForMonth(householdId, "2026-06");

    expect(stats.largestExpense).toBeNull();
    expect(stats.byCategory).toEqual([]);
  });

  it("throws when household is not found", async () => {
    const households: HouseholdRepository = {
      findById: vi.fn().mockResolvedValue(null),
      findAll: vi.fn(),
      create: vi.fn(),
      updateById: vi.fn(),
      deleteById: vi.fn(),
    };
    const service = new ExpenseStatsService(
      buildExpenses(),
      buildCategories(),
      households,
    );

    await expect(service.getStatsForMonth(householdId, "2026-06")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
