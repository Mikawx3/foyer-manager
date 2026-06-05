import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { NotFoundError, ValidationError } from "../errors/app.errors.js";
import type { DefaultSplitService } from "./default-split.service.js";
import type { CategoryRepository } from "../repositories/category.repository.js";
import type { ExpenseSplitRepository } from "../repositories/expense-split.repository.js";
import type { ExpenseRepository } from "../repositories/expense.repository.js";
import type { HouseholdRepository } from "../repositories/household.repository.js";
import type { SettlementRepository } from "../repositories/settlement.repository.js";
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
    updateById: vi.fn(),
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

function createSettlementRepositoryMock(
  overrides: Partial<SettlementRepository> = {},
): SettlementRepository {
  return {
    findAllByHousehold: vi.fn().mockResolvedValue([]),
    findById: vi.fn(),
    create: vi.fn(),
    deleteById: vi.fn(),
    ...overrides,
  };
}

describe("ExpenseService", () => {
  it("listByHousehold returns paginated expenses", async () => {
    const expenses = createExpenseRepoMock({
      countByWhere: vi.fn().mockResolvedValue(25),
      findPageByWhere: vi.fn().mockResolvedValue([prismaExpense]),
    });
    const households: HouseholdRepository = {
      findById: vi
        .fn()
        .mockResolvedValue({
          id: householdId,
          name: "Home",
          settlementPeriod: "none",
          createdAt: new Date(),
        }),
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
      createSettlementRepositoryMock(),
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
      findById: vi
        .fn()
        .mockResolvedValue({
          id: householdId,
          name: "Home",
          settlementPeriod: "none",
          createdAt: new Date(),
        }),
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
      createSettlementRepositoryMock(),
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
      createSettlementRepositoryMock(),
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

  it("getBalances aggregates paid and owed amounts for custom-mode expenses", async () => {
    const expenses = createExpenseRepoMock({
      findAllByHouseholdWithSplits: vi.fn().mockResolvedValue([
        {
          ...prismaExpense,
          splitMode: "custom",
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
      findById: vi
        .fn()
        .mockResolvedValue({
          id: householdId,
          name: "Home",
          settlementPeriod: "none",
          createdAt: new Date(),
        }),
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
      {
        findByExpenseId: vi.fn().mockResolvedValue([
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
        ]),
        replaceForExpense: vi.fn(),
      },
      households,
      tenants,
      { findById: vi.fn() },
      createDefaultSplitServiceMock(),
      createSettlementRepositoryMock(),
    );

    const balances = await service.getBalances(householdId);

    expect(balances).toEqual([
      {
        tenantId: tenantInHouse,
        tenantName: "A",
        paid: 120,
        owed: 60,
        balance: 60,
        settledAmount: 0,
      },
      {
        tenantId: "clt22345678901234567890123",
        tenantName: "B",
        paid: 0,
        owed: 60,
        balance: -60,
        settledAmount: 0,
      },
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
      createSettlementRepositoryMock(),
    );

    await service.assignSplits(expenseId, {
      splits: [{ tenantId: tenantInHouse, percentage: 100 }],
    });

    expect(expenses.updateSplitMode).toHaveBeenCalledWith(expenseId, "custom");
  });

  it("resetSplitsToDefault clears stored splits and returns dynamically resolved splits", async () => {
    const replaceForExpense = vi.fn().mockResolvedValue([]);
    const tenantB = "clt22345678901234567890124";
    const expenses = createExpenseRepoMock({
      findById: vi.fn().mockResolvedValue(prismaExpense),
      updateSplitMode: vi.fn().mockResolvedValue(prismaExpense),
    });
    const defaultSplits: DefaultSplitService = {
      getRules: vi.fn(),
      setRules: vi.fn(),
      resolveForExpense: vi.fn().mockResolvedValue([
        { tenantId: tenantInHouse, percentage: 50 },
        { tenantId: tenantB, percentage: 50 },
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
      createSettlementRepositoryMock(),
    );

    const result = await service.resetSplitsToDefault(expenseId);

    expect(replaceForExpense).toHaveBeenCalledWith(expenseId, []);
    expect(expenses.updateSplitMode).toHaveBeenCalledWith(expenseId, "default");
    expect(result).toHaveLength(2);
    expect(result[0]?.percentage).toBe(50);
    expect(result[0]?.amount).toBe(60);
    expect(result[1]?.percentage).toBe(50);
    expect(result[1]?.amount).toBe(60);
  });

  it("getSplits returns current default rule percentages, not stale stored splits", async () => {
    const tenantB = "clt22345678901234567890123";
    const findByExpenseId = vi.fn().mockResolvedValue([
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
        tenantId: tenantB,
        amount: new Prisma.Decimal(60),
        percentage: 50,
      },
    ]);
    const expenses = createExpenseRepoMock({
      findById: vi.fn().mockResolvedValue({
        ...prismaExpense,
        amount: new Prisma.Decimal(100),
      }),
    });
    const defaultSplits: DefaultSplitService = {
      getRules: vi.fn(),
      setRules: vi.fn(),
      resolveForExpense: vi.fn().mockResolvedValue([
        { tenantId: tenantInHouse, percentage: 70 },
        { tenantId: tenantB, percentage: 30 },
      ]),
      deleteCategoryRules: vi.fn(),
    };

    const service = new ExpenseService(
      expenses,
      { findByExpenseId, replaceForExpense: vi.fn() },
      { findById: vi.fn(), findAll: vi.fn(), create: vi.fn(), deleteById: vi.fn() },
      { findById: vi.fn(), findAllByHousehold: vi.fn(), create: vi.fn(), deleteById: vi.fn() },
      { findById: vi.fn() },
      defaultSplits,
      createSettlementRepositoryMock(),
    );

    const result = await service.getSplits(expenseId);

    expect(findByExpenseId).not.toHaveBeenCalled();
    expect(defaultSplits.resolveForExpense).toHaveBeenCalledWith(householdId, categoryId);
    expect(result).toHaveLength(2);
    expect(result[0]?.percentage).toBe(70);
    expect(result[0]?.amount).toBe(70);
    expect(result[1]?.percentage).toBe(30);
    expect(result[1]?.amount).toBe(30);
  });

  it("getBalances uses dynamic splits for default-mode expenses", async () => {
    const tenantB = "clt22345678901234567890123";
    const expenses = createExpenseRepoMock({
      findAllByHouseholdWithSplits: vi.fn().mockResolvedValue([
        {
          ...prismaExpense,
          amount: new Prisma.Decimal(100),
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
              tenantId: tenantB,
              amount: new Prisma.Decimal(40),
              percentage: 50,
            },
          ],
        },
      ]),
    });
    const households: HouseholdRepository = {
      findById: vi
        .fn()
        .mockResolvedValue({
          id: householdId,
          name: "Home",
          settlementPeriod: "none",
          createdAt: new Date(),
        }),
      findAll: vi.fn(),
      create: vi.fn(),
      deleteById: vi.fn(),
    };
    const tenants: TenantRepository = {
      findById: vi.fn(),
      findAllByHousehold: vi.fn().mockResolvedValue([
        { id: tenantInHouse, householdId, name: "A", email: "a@test.com", createdAt: new Date() },
        { id: tenantB, householdId, name: "B", email: "b@test.com", createdAt: new Date() },
      ]),
      create: vi.fn(),
      deleteById: vi.fn(),
    };
    const defaultSplits: DefaultSplitService = {
      getRules: vi.fn(),
      setRules: vi.fn(),
      resolveForExpense: vi.fn().mockResolvedValue([
        { tenantId: tenantInHouse, percentage: 70 },
        { tenantId: tenantB, percentage: 30 },
      ]),
      deleteCategoryRules: vi.fn(),
    };

    const service = new ExpenseService(
      expenses,
      { findByExpenseId: vi.fn(), replaceForExpense: vi.fn() },
      households,
      tenants,
      { findById: vi.fn() },
      defaultSplits,
      createSettlementRepositoryMock(),
    );

    const balances = await service.getBalances(householdId);

    expect(balances).toEqual([
      {
        tenantId: tenantInHouse,
        tenantName: "A",
        paid: 100,
        owed: 70,
        balance: 30,
        settledAmount: 0,
      },
      {
        tenantId: tenantB,
        tenantName: "B",
        paid: 0,
        owed: 30,
        balance: -30,
        settledAmount: 0,
      },
    ]);
  });

  it("create with participant subset persists custom redistributed splits", async () => {
    const tenantB = "clt22345678901234567890123";
    const tenantC = "clt32345678901234567890123";
    const replaceForExpense = vi.fn().mockResolvedValue([]);
    const createdExpense = { ...prismaExpense, id: expenseId };
    const expenses = createExpenseRepoMock({
      create: vi.fn().mockResolvedValue(createdExpense),
      findById: vi.fn().mockResolvedValue({ ...createdExpense, splitMode: "custom" }),
      updateSplitMode: vi.fn().mockResolvedValue({ ...createdExpense, splitMode: "custom" }),
    });
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
      findAllByHousehold: vi.fn().mockResolvedValue([
        { id: tenantInHouse, householdId, name: "A", email: "a@test.com", createdAt: new Date() },
        { id: tenantB, householdId, name: "B", email: "b@test.com", createdAt: new Date() },
        { id: tenantC, householdId, name: "C", email: "c@test.com", createdAt: new Date() },
      ]),
      create: vi.fn(),
      deleteById: vi.fn(),
    };
    const defaultSplits: DefaultSplitService = {
      getRules: vi.fn(),
      setRules: vi.fn(),
      resolveForExpense: vi.fn().mockResolvedValue([
        { tenantId: tenantInHouse, percentage: 50 },
        { tenantId: tenantB, percentage: 30 },
        { tenantId: tenantC, percentage: 20 },
      ]),
      deleteCategoryRules: vi.fn(),
    };

    const service = new ExpenseService(
      expenses,
      { findByExpenseId: vi.fn(), replaceForExpense },
      {
        findById: vi
        .fn()
        .mockResolvedValue({
          id: householdId,
          name: "Home",
          settlementPeriod: "none",
          createdAt: new Date(),
        }),
        findAll: vi.fn(),
        create: vi.fn(),
        deleteById: vi.fn(),
      },
      tenants,
      { findById: vi.fn().mockResolvedValue({ id: categoryId, householdId, name: "Rent" }) },
      defaultSplits,
      createSettlementRepositoryMock(),
    );

    await service.create({
      amount: 100,
      description: "Dinner",
      categoryId,
      paidByTenantId: tenantInHouse,
      householdId,
      date: "2026-06-01",
      splitMode: "default",
      participantIds: [tenantInHouse, tenantB],
    });

    expect(expenses.updateSplitMode).toHaveBeenCalledWith(expenseId, "custom");
    expect(replaceForExpense).toHaveBeenCalled();
    const splitInput = replaceForExpense.mock.calls[0]?.[1] as { tenantId: string; percentage: number }[];
    expect(splitInput).toHaveLength(2);
    expect(splitInput.reduce((sum, row) => sum + row.percentage, 0)).toBe(100);
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
      createSettlementRepositoryMock(),
    );

    await expect(service.resetSplitsToDefault(expenseId)).rejects.toBeInstanceOf(
      ValidationError,
    );
  });
});

