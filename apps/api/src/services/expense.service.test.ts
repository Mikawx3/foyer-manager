import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { NotFoundError, ValidationError } from "../errors/app.errors.js";
import type { DefaultSplitService } from "./default-split.service.js";
import type { CategoryRepository } from "../repositories/category.repository.js";
import type { ExpenseSplitRepository } from "../repositories/expense-split.repository.js";
import type { ExpenseRepository } from "../repositories/expense.repository.js";
import type { HouseholdRepository } from "../repositories/household.repository.js";
import type { TenantRepository } from "../repositories/tenant.repository.js";
import { ExpenseService } from "./expense.service.js";

const householdId = "clh12345678901234567890123";
const expenseId = "cle12345678901234567890123";
const categoryId = "clc12345678901234567890123";
const tenantInHouse = "clt12345678901234567890123";
const tenantOutHouse = "clt12345678901234567890124";

const prismaExpense = {
  id: expenseId,
  amount: new Prisma.Decimal(120),
  description: "Rent",
  categoryId,
  paidByTenantId: tenantInHouse,
  householdId,
  splitMode: "default",
  date: new Date("2026-06-01T00:00:00.000Z"),
  createdAt: new Date("2026-06-01T00:00:00.000Z"),
};

function createExpenseRepoMock(
  overrides: Partial<ExpenseRepository> = {},
): ExpenseRepository {
  return {
    findById: vi.fn(),
    findAllByHousehold: vi.fn(),
    countByWhere: vi.fn(),
    findPageByWhere: vi.fn(),
    findAllByHouseholdWithSplits: vi.fn(),
    create: vi.fn(),
    updateSplitMode: vi.fn(),
    deleteById: vi.fn(),
    ...overrides,
  };
}

function createDefaultSplitServiceMock() {
  return {
    getRules: vi.fn(),
    setRules: vi.fn(),
    resolveForExpense: vi.fn().mockResolvedValue([]),
    deleteCategoryRules: vi.fn(),
  };
}

describe("ExpenseService", () => {
  it("listByHousehold returns paginated expenses", async () => {
    const expenses = createExpenseRepoMock({
      countByWhere: vi.fn().mockResolvedValue(25),
      findPageByWhere: vi.fn().mockResolvedValue([prismaExpense]),
    });
    const households: HouseholdRepository = {
      findById: vi.fn().mockResolvedValue({ id: householdId, name: "Home", createdAt: new Date() }),
      findAll: vi.fn(),
      create: vi.fn(),
      deleteById: vi.fn(),
    };
    const service = new ExpenseService(
      expenses,
      { findByExpenseId: vi.fn(), replaceForExpense: vi.fn() },
      households,
      { findById: vi.fn(), findAllByHousehold: vi.fn(), create: vi.fn(), deleteById: vi.fn() },
      {
        findById: vi.fn(),
        findAllByHousehold: vi.fn(),
        create: vi.fn(),
        countExpenses: vi.fn(),
        deleteById: vi.fn(),
      },
      createDefaultSplitServiceMock(),
    );

    const result = await service.listByHousehold({
      householdId,
      page: 2,
      limit: 20,
    });

    expect(result.total).toBe(25);
    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(2);
    expect(result.data).toHaveLength(1);
    expect(expenses.findPageByWhere).toHaveBeenCalledWith(
      { householdId },
      { skip: 20, take: 20 },
    );
  });

  it("listByHousehold applies month and category filters", async () => {
    const expenses = createExpenseRepoMock({
      countByWhere: vi.fn().mockResolvedValue(3),
      findPageByWhere: vi.fn().mockResolvedValue([prismaExpense]),
    });
    const households: HouseholdRepository = {
      findById: vi.fn().mockResolvedValue({ id: householdId, name: "Home", createdAt: new Date() }),
      findAll: vi.fn(),
      create: vi.fn(),
      deleteById: vi.fn(),
    };
    const service = new ExpenseService(
      expenses,
      { findByExpenseId: vi.fn(), replaceForExpense: vi.fn() },
      households,
      { findById: vi.fn(), findAllByHousehold: vi.fn(), create: vi.fn(), deleteById: vi.fn() },
      {
        findById: vi.fn(),
        findAllByHousehold: vi.fn(),
        create: vi.fn(),
        countExpenses: vi.fn(),
        deleteById: vi.fn(),
      },
      createDefaultSplitServiceMock(),
    );

    await service.listByHousehold({
      householdId,
      page: 1,
      limit: 10,
      month: "2026-06",
      categoryId,
    });

    expect(expenses.countByWhere).toHaveBeenCalledWith({
      householdId,
      categoryId,
      date: {
        gte: new Date(2026, 5, 1),
        lt: new Date(2026, 6, 1),
      },
    });
  });

  it("assignSplits rejects tenant outside expense household", async () => {
    const expenses = createExpenseRepoMock({
      findById: vi.fn().mockResolvedValue(prismaExpense),
    });
    const tenants: TenantRepository = {
      findById: vi.fn().mockImplementation((id: string) =>
        Promise.resolve(
          id === tenantInHouse
            ? { id, householdId, name: "A", email: "a@test.com", createdAt: new Date() }
            : {
                id: tenantOutHouse,
                householdId: "other",
                name: "B",
                email: "b@test.com",
                createdAt: new Date(),
              },
        ),
      ),
      findAllByHousehold: vi.fn(),
      create: vi.fn(),
      deleteById: vi.fn(),
    };

    const service = new ExpenseService(
      expenses,
      { findByExpenseId: vi.fn(), replaceForExpense: vi.fn() },
      { findById: vi.fn(), findAll: vi.fn(), create: vi.fn(), deleteById: vi.fn() },
      tenants,
      { findById: vi.fn() },
      createDefaultSplitServiceMock(),
    );

    await expect(
      service.assignSplits(expenseId, {
        splits: [
          { tenantId: tenantInHouse, percentage: 50 },
          { tenantId: tenantOutHouse, percentage: 50 },
        ],
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("getBalances aggregates paid and owed amounts", async () => {
    const expenses = createExpenseRepoMock({
      findAllByHouseholdWithSplits: vi.fn().mockResolvedValue([
        {
          ...prismaExpense,
          splits: [
            {
              id: "cls1",
              expenseId,
              tenantId: tenantInHouse,
              amount: new Prisma.Decimal(60),
              percentage: 50,
            },
            {
              id: "cls2",
              expenseId,
              tenantId: "clt22345678901234567890123",
              amount: new Prisma.Decimal(60),
              percentage: 50,
            },
          ],
        },
      ]),
    });
    const households: HouseholdRepository = {
      findById: vi.fn().mockResolvedValue({ id: householdId, name: "Home", createdAt: new Date() }),
      findAll: vi.fn(),
      create: vi.fn(),
      deleteById: vi.fn(),
    };
    const tenants: TenantRepository = {
      findById: vi.fn(),
      findAllByHousehold: vi.fn().mockResolvedValue([
        { id: tenantInHouse, householdId, name: "A", email: "a@test.com", createdAt: new Date() },
        {
          id: "clt22345678901234567890123",
          householdId,
          name: "B",
          email: "b@test.com",
          createdAt: new Date(),
        },
      ]),
      create: vi.fn(),
      deleteById: vi.fn(),
    };

    const service = new ExpenseService(
      expenses,
      { findByExpenseId: vi.fn(), replaceForExpense: vi.fn() },
      households,
      tenants,
      { findById: vi.fn() },
      createDefaultSplitServiceMock(),
    );

    const balances = await service.getBalances(householdId);

    expect(balances).toEqual([
      { tenantId: tenantInHouse, totalPaid: 120, totalOwed: 60, balance: 60 },
      { tenantId: "clt22345678901234567890123", totalPaid: 0, totalOwed: 60, balance: -60 },
    ]);
  });

  it("assignSplits sets splitMode to custom", async () => {
    const replaceForExpense = vi.fn().mockResolvedValue([
      {
        id: "cls1",
        expenseId,
        tenantId: tenantInHouse,
        amount: new Prisma.Decimal(120),
        percentage: 100,
      },
    ]);
    const expenses = createExpenseRepoMock({
      findById: vi.fn().mockResolvedValue(prismaExpense),
      updateSplitMode: vi.fn().mockResolvedValue({ ...prismaExpense, splitMode: "custom" }),
    });
    const tenants: TenantRepository = {
      findById: vi.fn().mockResolvedValue({
        id: tenantInHouse,
        householdId,
        name: "A",
        email: "a@test.com",
        createdAt: new Date(),
      }),
      findAllByHousehold: vi.fn(),
      create: vi.fn(),
      deleteById: vi.fn(),
    };

    const service = new ExpenseService(
      expenses,
      { findByExpenseId: vi.fn(), replaceForExpense },
      { findById: vi.fn(), findAll: vi.fn(), create: vi.fn(), deleteById: vi.fn() },
      tenants,
      { findById: vi.fn() },
      createDefaultSplitServiceMock(),
    );

    await service.assignSplits(expenseId, {
      splits: [{ tenantId: tenantInHouse, percentage: 100 }],
    });

    expect(expenses.updateSplitMode).toHaveBeenCalledWith(expenseId, "custom");
  });

  it("resetSplitsToDefault applies resolved rules and sets splitMode default", async () => {
    const replaceForExpense = vi.fn().mockResolvedValue([
      {
        id: "cls1",
        expenseId,
        tenantId: tenantInHouse,
        amount: new Prisma.Decimal(60),
        percentage: 50,
      },
    ]);
    const expenses = createExpenseRepoMock({
      findById: vi.fn().mockResolvedValue(prismaExpense),
      updateSplitMode: vi.fn().mockResolvedValue(prismaExpense),
    });
    const defaultSplits: DefaultSplitService = {
      getRules: vi.fn(),
      setRules: vi.fn(),
      resolveForExpense: vi.fn().mockResolvedValue([
        { tenantId: tenantInHouse, percentage: 50 },
        { tenantId: "clt22345678901234567890124", percentage: 50 },
      ]),
      deleteCategoryRules: vi.fn(),
    };
    const tenants: TenantRepository = {
      findById: vi.fn().mockImplementation((id: string) =>
        Promise.resolve({
          id,
          householdId,
          name: "M",
          email: `${id}@test.com`,
          createdAt: new Date(),
        }),
      ),
      findAllByHousehold: vi.fn(),
      create: vi.fn(),
      deleteById: vi.fn(),
    };

    const service = new ExpenseService(
      expenses,
      { findByExpenseId: vi.fn(), replaceForExpense },
      { findById: vi.fn(), findAll: vi.fn(), create: vi.fn(), deleteById: vi.fn() },
      tenants,
      { findById: vi.fn() },
      defaultSplits,
    );

    await service.resetSplitsToDefault(expenseId);

    expect(replaceForExpense).toHaveBeenCalled();
    expect(expenses.updateSplitMode).toHaveBeenCalledWith(expenseId, "default");
  });

  it("resetSplitsToDefault throws when no rules resolved", async () => {
    const expenses = createExpenseRepoMock({
      findById: vi.fn().mockResolvedValue(prismaExpense),
    });

    const service = new ExpenseService(
      expenses,
      { findByExpenseId: vi.fn(), replaceForExpense: vi.fn() },
      { findById: vi.fn(), findAll: vi.fn(), create: vi.fn(), deleteById: vi.fn() },
      { findById: vi.fn(), findAllByHousehold: vi.fn(), create: vi.fn(), deleteById: vi.fn() },
      { findById: vi.fn() },
      createDefaultSplitServiceMock(),
    );

    await expect(service.resetSplitsToDefault(expenseId)).rejects.toBeInstanceOf(
      ValidationError,
    );
  });
});

