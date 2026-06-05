import { describe, expect, it, vi } from "vitest";
import { NotFoundError } from "../errors/app.errors.js";
import type { ExpenseRepository } from "../repositories/expense.repository.js";
import type { HouseholdRepository } from "../repositories/household.repository.js";
import type { RecurringExpenseRepository } from "../repositories/recurring-expense.repository.js";
import type { TenantRepository } from "../repositories/tenant.repository.js";
import type { ExpenseService } from "./expense.service.js";
import { HouseholdService } from "./household.service.js";

const householdId = "clh12345678901234567890123";

const prismaHousehold = {
  id: householdId,
  name: "Home",
  type: "shared",
  settlementPeriod: "monthly",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

function buildRepository(overrides: Partial<HouseholdRepository> = {}): HouseholdRepository {
  return {
    findById: vi.fn().mockResolvedValue(prismaHousehold),
    findAll: vi.fn(),
    create: vi.fn(),
    createWithSoloTenant: vi.fn(),
    updateById: vi.fn(),
    deleteById: vi.fn(),
    ...overrides,
  };
}

describe("HouseholdService", () => {
  it("getById throws NotFoundError when missing", async () => {
    const repository = buildRepository({
      findById: vi.fn().mockResolvedValue(null),
    });
    const service = new HouseholdService(repository);

    await expect(service.getById(householdId)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("create returns mapped shared household", async () => {
    const repository = buildRepository({
      create: vi.fn().mockResolvedValue(prismaHousehold),
    });
    const service = new HouseholdService(repository);

    const result = await service.create({
      name: "Home",
      type: "shared",
      settlementPeriod: "monthly",
    });

    expect(result).toEqual({
      id: prismaHousehold.id,
      name: "Home",
      type: "shared",
      settlementPeriod: "monthly",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    expect(repository.create).toHaveBeenCalledWith({
      name: "Home",
      type: "shared",
      settlementPeriod: "monthly",
    });
  });

  it("create solo household auto-creates default tenant via repository", async () => {
    const soloHousehold = { ...prismaHousehold, type: "solo" };
    const repository = buildRepository({
      createWithSoloTenant: vi.fn().mockResolvedValue(soloHousehold),
    });
    const service = new HouseholdService(repository);

    const result = await service.create({
      name: "My budget",
      type: "solo",
      settlementPeriod: "none",
    });

    expect(result.type).toBe("solo");
    expect(repository.createWithSoloTenant).toHaveBeenCalledOnce();
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("getDeletionPreview aggregates household stats", async () => {
    const repository = buildRepository();
    const tenants: TenantRepository = {
      findById: vi.fn(),
      findAllByHousehold: vi.fn().mockResolvedValue([
        { id: "t1", active: true },
        { id: "t2", active: true },
        { id: "t3", active: false },
      ]),
      create: vi.fn(),
      deleteById: vi.fn(),
    };
    const expenses: ExpenseRepository = {
      findById: vi.fn(),
      findAllByHousehold: vi.fn(),
      countByWhere: vi.fn().mockResolvedValue(11),
      sumAmountByHousehold: vi.fn().mockResolvedValue(3859.84),
      findPageByWhere: vi.fn(),
      findAllByHouseholdWithSplits: vi.fn(),
      create: vi.fn(),
      findByRecurringExpenseAndDate: vi.fn(),
      countByRecurringExpenseId: vi.fn(),
      countByRecurringExpenseIds: vi.fn(),
      deleteByRecurringExpenseId: vi.fn(),
      updateSplitMode: vi.fn(),
      updateById: vi.fn(),
      deleteById: vi.fn(),
    };
    const recurring: RecurringExpenseRepository = {
      findAllByHousehold: vi.fn().mockResolvedValue([{}, {}]),
      findDueByHousehold: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateNextDueDate: vi.fn(),
      deleteById: vi.fn(),
    };
    const expenseBalances: ExpenseService = {
      getBalances: vi.fn().mockResolvedValue([
        {
          tenantId: "t1",
          tenantName: "Alice",
          paid: 1000,
          owed: 400,
          balance: 600,
          settledAmount: 0,
        },
        {
          tenantId: "t2",
          tenantName: "Bob",
          paid: 200,
          owed: 800,
          balance: -600,
          settledAmount: 0,
        },
      ]),
    } as unknown as ExpenseService;

    const service = new HouseholdService(repository, tenants, expenses, recurring, expenseBalances);
    const preview = await service.getDeletionPreview(householdId);

    expect(preview).toEqual({
      memberCount: 2,
      expenseCount: 11,
      expenseTotal: 3859.84,
      recurringExpenseCount: 2,
      membersWithUnresolvedBalance: 2,
      outstandingBalanceTotal: 1200,
    });
  });

  it("getDeletionPreview returns zero outstanding balance when settled", async () => {
    const repository = buildRepository();
    const tenants: TenantRepository = {
      findById: vi.fn(),
      findAllByHousehold: vi.fn().mockResolvedValue([{ id: "t1", active: true }]),
      create: vi.fn(),
      deleteById: vi.fn(),
    };
    const expenses: ExpenseRepository = {
      findById: vi.fn(),
      findAllByHousehold: vi.fn(),
      countByWhere: vi.fn().mockResolvedValue(0),
      sumAmountByHousehold: vi.fn().mockResolvedValue(0),
      findPageByWhere: vi.fn(),
      findAllByHouseholdWithSplits: vi.fn(),
      create: vi.fn(),
      findByRecurringExpenseAndDate: vi.fn(),
      countByRecurringExpenseId: vi.fn(),
      countByRecurringExpenseIds: vi.fn(),
      deleteByRecurringExpenseId: vi.fn(),
      updateSplitMode: vi.fn(),
      updateById: vi.fn(),
      deleteById: vi.fn(),
    };
    const recurring: RecurringExpenseRepository = {
      findAllByHousehold: vi.fn().mockResolvedValue([]),
      findDueByHousehold: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateNextDueDate: vi.fn(),
      deleteById: vi.fn(),
    };
    const expenseBalances: ExpenseService = {
      getBalances: vi.fn().mockResolvedValue([
        {
          tenantId: "t1",
          tenantName: "Alice",
          paid: 0,
          owed: 0,
          balance: 0,
          settledAmount: 0,
        },
      ]),
    } as unknown as ExpenseService;

    const service = new HouseholdService(repository, tenants, expenses, recurring, expenseBalances);
    const preview = await service.getDeletionPreview(householdId);

    expect(preview.membersWithUnresolvedBalance).toBe(0);
    expect(preview.outstandingBalanceTotal).toBe(0);
  });
});
