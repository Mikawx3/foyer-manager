import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { NotFoundError, ValidationError } from "../errors/app.errors.js";
import type { ExpenseRepository } from "../repositories/expense.repository.js";
import type { HouseholdRepository } from "../repositories/household.repository.js";
import type { IncomeTemplateRepository } from "../repositories/income-template.repository.js";
import type { IncomeRepository } from "../repositories/income.repository.js";
import type { TenantRepository } from "../repositories/tenant.repository.js";
import type { ExpenseService } from "./expense.service.js";
import type { ExpenseStatsService } from "./expense-stats.service.js";
import { IncomeService } from "./income.service.js";

const householdId = "clh12345678901234567890123";
const tenantId = "clt12345678901234567890123";
const incomeId = "cli12345678901234567890123";
const templateId = "ctp12345678901234567890123";

function buildIncomeRecord(overrides: Partial<{
  id: string;
  amount: number;
  month: string;
  label: string;
  tenantId: string;
}> = {}) {
  return {
    id: overrides.id ?? incomeId,
    householdId,
    tenantId: overrides.tenantId ?? tenantId,
    amount: new Prisma.Decimal(overrides.amount ?? 2000),
    label: overrides.label ?? "Salary",
    month: overrides.month ?? "2026-06",
    note: null,
    createdAt: new Date("2026-06-01"),
    updatedAt: new Date("2026-06-01"),
  };
}

function buildTemplateRecord(amount = 3000) {
  return {
    id: templateId,
    householdId,
    tenantId,
    amount: new Prisma.Decimal(amount),
    label: "Salary",
    note: null,
    active: true,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  };
}

function emptyIncomeTemplates(): IncomeTemplateRepository {
  return {
    findAllByHousehold: vi.fn().mockResolvedValue([]),
    findActiveByHousehold: vi.fn().mockResolvedValue([]),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
}

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

function mockExpenseStatsSvc(totalExpenses: number): ExpenseStatsService {
  return {
    getStatsForMonth: vi.fn().mockResolvedValue({
      month: "2026-06",
      totalExpenses,
      expenseCount: totalExpenses > 0 ? 1 : 0,
      largestExpense: totalExpenses > 0 ? { description: "Test", amount: totalExpenses } : null,
      byCategory: [],
      trend: [],
    }),
  } as unknown as ExpenseStatsService;
}

describe("IncomeService", () => {
  it("creates income for a tenant in the household", async () => {
    const incomes: IncomeRepository = {
      findByHouseholdAndMonth: vi.fn(),
      findByHousehold: vi.fn(),
      findById: vi.fn(),
      create: vi.fn().mockResolvedValue(buildIncomeRecord()),
      update: vi.fn(),
      delete: vi.fn(),
    };
    const tenants: TenantRepository = {
      findById: vi.fn().mockResolvedValue({
        id: tenantId,
        name: "Alice",
        email: "alice@test.com",
        color: null,
        active: true,
        archivedAt: null,
        householdId,
        createdAt: new Date(),
      }),
      findAllByHousehold: vi.fn(),
      create: vi.fn(),
      deleteById: vi.fn(),
    };

    const service = new IncomeService(
      incomes,
      emptyIncomeTemplates(),
      { sumAmountByWhere: vi.fn() } as unknown as ExpenseRepository,
      buildHouseholds(),
      tenants,
      { getTenantOwedTotalsForMonth: vi.fn() } as unknown as ExpenseService,
    );

    const result = await service.create(householdId, {
      tenantId,
      amount: 2000,
      label: "Salary",
      month: "2026-06",
      householdId,
    });

    expect(result.amount).toBe(2000);
    expect(incomes.create).toHaveBeenCalled();
  });

  it("rejects create when householdId in body mismatches URL", async () => {
    const service = new IncomeService(
      {
        findByHouseholdAndMonth: vi.fn(),
        findByHousehold: vi.fn(),
        findById: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      emptyIncomeTemplates(),
      { sumAmountByWhere: vi.fn() } as unknown as ExpenseRepository,
      buildHouseholds(),
      { findById: vi.fn(), findAllByHousehold: vi.fn(), create: vi.fn(), deleteById: vi.fn() },
      { getTenantOwedTotalsForMonth: vi.fn() } as unknown as ExpenseService,
    );

    await expect(
      service.create(householdId, {
        tenantId,
        amount: 100,
        label: "Salary",
        month: "2026-06",
        householdId: "clh99999999999999999999999999",
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("returns savingsRate 0 when no income", async () => {
    const incomes: IncomeRepository = {
      findByHouseholdAndMonth: vi.fn(),
      findByHousehold: vi.fn().mockResolvedValue([]),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    const expenses: ExpenseRepository = {
      sumAmountByWhere: vi.fn().mockResolvedValue(500),
    } as unknown as ExpenseRepository;
    const tenants: TenantRepository = {
      findAllByHousehold: vi.fn().mockResolvedValue([
        {
          id: tenantId,
          name: "Alice",
          email: "alice@test.com",
          color: null,
          active: true,
          archivedAt: null,
          householdId,
          createdAt: new Date(),
        },
      ]),
      findById: vi.fn(),
      create: vi.fn(),
      deleteById: vi.fn(),
    };
    const expenseSvc: ExpenseService = {
      getTenantOwedTotalsForMonth: vi.fn().mockResolvedValue(new Map([[tenantId, 300]])),
    } as unknown as ExpenseService;

    const service = new IncomeService(
      incomes,
      emptyIncomeTemplates(),
      expenses,
      buildHouseholds(),
      tenants,
      expenseSvc,
      mockExpenseStatsSvc(500),
    );

    const stats = await service.getIncomeStats(householdId, "2026-06");

    expect(stats.savingsRate).toBe(0);
    expect(stats.totalIncome).toBe(0);
    expect(stats.remainingBudget).toBe(-500);
  });

  it("uses recurring templates in stats when no override exists", async () => {
    const incomes: IncomeRepository = {
      findByHouseholdAndMonth: vi.fn(),
      findByHousehold: vi.fn().mockResolvedValue([]),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    const templates: IncomeTemplateRepository = {
      findAllByHousehold: vi.fn().mockResolvedValue([buildTemplateRecord(3000)]),
      findActiveByHousehold: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    const expenses: ExpenseRepository = {
      sumAmountByWhere: vi.fn().mockResolvedValue(1000),
    } as unknown as ExpenseRepository;
    const tenants: TenantRepository = {
      findAllByHousehold: vi.fn().mockResolvedValue([
        {
          id: tenantId,
          name: "Alice",
          email: "alice@test.com",
          color: null,
          active: true,
          archivedAt: null,
          householdId,
          createdAt: new Date(),
        },
      ]),
      findById: vi.fn(),
      create: vi.fn(),
      deleteById: vi.fn(),
    };

    const service = new IncomeService(
      incomes,
      templates,
      expenses,
      buildHouseholds(),
      tenants,
      { getTenantOwedTotalsForMonth: vi.fn().mockResolvedValue(new Map()) } as unknown as ExpenseService,
      mockExpenseStatsSvc(1000),
    );

    const stats = await service.getIncomeStats(householdId, "2026-06");
    expect(stats.totalIncome).toBe(3000);
    expect(stats.remainingBudget).toBe(2000);
  });

  it("computes negative remainingBudget when expenses exceed income", async () => {
    const incomes: IncomeRepository = {
      findByHouseholdAndMonth: vi.fn(),
      findByHousehold: vi.fn().mockResolvedValue([buildIncomeRecord({ amount: 1000 })]),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    const expenses: ExpenseRepository = {
      sumAmountByWhere: vi.fn().mockResolvedValue(1500),
    } as unknown as ExpenseRepository;
    const tenants: TenantRepository = {
      findAllByHousehold: vi.fn().mockResolvedValue([
        {
          id: tenantId,
          name: "Alice",
          email: "alice@test.com",
          color: null,
          active: true,
          archivedAt: null,
          householdId,
          createdAt: new Date(),
        },
      ]),
      findById: vi.fn(),
      create: vi.fn(),
      deleteById: vi.fn(),
    };
    const expenseSvc: ExpenseService = {
      getTenantOwedTotalsForMonth: vi.fn().mockResolvedValue(new Map([[tenantId, 800]])),
    } as unknown as ExpenseService;

    const service = new IncomeService(
      incomes,
      emptyIncomeTemplates(),
      expenses,
      buildHouseholds(),
      tenants,
      expenseSvc,
      mockExpenseStatsSvc(1500),
    );

    const stats = await service.getIncomeStats(householdId, "2026-06");

    expect(stats.remainingBudget).toBe(-500);
    expect(stats.savingsRate).toBe(-50);
    expect(stats.byTenant[0]?.balance).toBe(200);
  });

  it("returns 6 trend entries", async () => {
    const incomes: IncomeRepository = {
      findByHouseholdAndMonth: vi.fn(),
      findByHousehold: vi.fn().mockResolvedValue([]),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    const expenses: ExpenseRepository = {
      sumAmountByWhere: vi.fn().mockResolvedValue(0),
    } as unknown as ExpenseRepository;
    const tenants: TenantRepository = {
      findAllByHousehold: vi.fn().mockResolvedValue([]),
      findById: vi.fn(),
      create: vi.fn(),
      deleteById: vi.fn(),
    };
    const expenseSvc: ExpenseService = {
      getTenantOwedTotalsForMonth: vi.fn().mockResolvedValue(new Map()),
    } as unknown as ExpenseService;

    const service = new IncomeService(
      incomes,
      emptyIncomeTemplates(),
      expenses,
      buildHouseholds(),
      tenants,
      expenseSvc,
      mockExpenseStatsSvc(0),
    );

    const stats = await service.getIncomeStats(householdId, "2026-06");

    expect(stats.trend).toHaveLength(6);
    expect(stats.trend[5]?.month).toBe("2026-06");
    expect(stats.trend[0]?.month).toBe("2026-01");
  });

  it("throws NotFoundError when deleting unknown income", async () => {
    const incomes: IncomeRepository = {
      findByHouseholdAndMonth: vi.fn(),
      findByHousehold: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    const service = new IncomeService(
      incomes,
      emptyIncomeTemplates(),
      { sumAmountByWhere: vi.fn() } as unknown as ExpenseRepository,
      buildHouseholds(),
      { findById: vi.fn(), findAllByHousehold: vi.fn(), create: vi.fn(), deleteById: vi.fn() },
      { getTenantOwedTotalsForMonth: vi.fn() } as unknown as ExpenseService,
    );

    await expect(service.delete(householdId, incomeId)).rejects.toBeInstanceOf(NotFoundError);
  });
});
