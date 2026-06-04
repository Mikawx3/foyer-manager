import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { NotFoundError } from "../errors/app.errors.js";
import type { CategoryRepository } from "../repositories/category.repository.js";
import type { ExpenseSplitRepository } from "../repositories/expense-split.repository.js";
import type { ExpenseRepository } from "../repositories/expense.repository.js";
import type { HouseholdRepository } from "../repositories/household.repository.js";
import type { TenantRepository } from "../repositories/tenant.repository.js";
import { ExpenseService } from "./expense.service.js";

const householdId = "clh12345678901234567890123";
const expenseId = "cle12345678901234567890123";
const tenantInHouse = "clt12345678901234567890123";
const tenantOutHouse = "clt12345678901234567890124";

const prismaExpense = {
  id: expenseId,
  amount: new Prisma.Decimal(120),
  description: "Rent",
  categoryId: "clc12345678901234567890123",
  paidByTenantId: tenantInHouse,
  householdId,
  date: new Date("2026-06-01T00:00:00.000Z"),
  createdAt: new Date("2026-06-01T00:00:00.000Z"),
};

describe("ExpenseService", () => {
  it("assignSplits rejects tenant outside expense household", async () => {
    const expenses: ExpenseRepository = {
      findById: vi.fn().mockResolvedValue(prismaExpense),
      findAllByHousehold: vi.fn(),
      findAllByHouseholdWithSplits: vi.fn(),
      create: vi.fn(),
      deleteById: vi.fn(),
    };
    const splits: ExpenseSplitRepository = {
      findByExpenseId: vi.fn(),
      replaceForExpense: vi.fn(),
    };
    const households: HouseholdRepository = {
      findById: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      deleteById: vi.fn(),
    };
    const tenants: TenantRepository = {
      findById: vi.fn().mockImplementation((id: string) =>
        Promise.resolve(
          id === tenantInHouse
            ? { id, householdId, name: "A", email: "a@test.com", createdAt: new Date() }
            : { id: tenantOutHouse, householdId: "other", name: "B", email: "b@test.com", createdAt: new Date() },
        ),
      ),
      findAllByHousehold: vi.fn(),
      create: vi.fn(),
      deleteById: vi.fn(),
    };
    const categories: CategoryRepository = {
      findById: vi.fn(),
    };

    const service = new ExpenseService(
      expenses,
      splits,
      households,
      tenants,
      categories,
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
    const expenses: ExpenseRepository = {
      findById: vi.fn(),
      findAllByHousehold: vi.fn(),
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
      create: vi.fn(),
      deleteById: vi.fn(),
    };
    const splits: ExpenseSplitRepository = {
      findByExpenseId: vi.fn(),
      replaceForExpense: vi.fn(),
    };
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
        { id: "clt22345678901234567890123", householdId, name: "B", email: "b@test.com", createdAt: new Date() },
      ]),
      create: vi.fn(),
      deleteById: vi.fn(),
    };
    const categories: CategoryRepository = {
      findById: vi.fn(),
    };

    const service = new ExpenseService(
      expenses,
      splits,
      households,
      tenants,
      categories,
    );

    const balances = await service.getBalances(householdId);

    expect(balances).toEqual([
      { tenantId: tenantInHouse, totalPaid: 120, totalOwed: 60, balance: 60 },
      { tenantId: "clt22345678901234567890123", totalPaid: 0, totalOwed: 60, balance: -60 },
    ]);
  });
});
