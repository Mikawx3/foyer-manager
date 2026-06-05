import { describe, expect, it, vi } from "vitest";
import { NotFoundError } from "../errors/app.errors.js";
import type { CategoryRepository } from "../repositories/category.repository.js";
import type { ExpenseRepository } from "../repositories/expense.repository.js";
import type { HouseholdRepository } from "../repositories/household.repository.js";
import type {
  RecurringExpenseRepository,
  RecurringExpenseWithRelations,
} from "../repositories/recurring-expense.repository.js";
import type { TenantRepository } from "../repositories/tenant.repository.js";
import type { ExpenseService } from "./expense.service.js";
import { RecurringExpenseService } from "./recurring-expense.service.js";

const householdId = "clh12345678901234567890123";
const recurringId = "cre12345678901234567890123";
const categoryId = "cat12345678901234567890123";
const tenantId = "ten12345678901234567890123";

function buildRecurringRecord(
  overrides: Partial<RecurringExpenseWithRelations> = {},
): RecurringExpenseWithRelations {
  return {
    id: recurringId,
    householdId,
    title: "Rent",
    amount: { toNumber: () => 1000 } as RecurringExpenseWithRelations["amount"],
    category: categoryId,
    paidById: tenantId,
    frequency: "monthly",
    startDate: new Date("2026-03-01T00:00:00.000Z"),
    nextDueDate: new Date("2026-03-01T00:00:00.000Z"),
    active: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    paidBy: { id: tenantId, name: "Alice", email: null, householdId, createdAt: new Date() },
    splits: [
      {
        id: "split1",
        recurringExpenseId: recurringId,
        tenantId,
        percentage: 100,
        tenant: { id: tenantId, name: "Alice", email: null, householdId, createdAt: new Date() },
      },
    ],
    ...overrides,
  };
}

function buildHouseholds(): HouseholdRepository {
  return {
    findById: vi.fn().mockResolvedValue({
      id: householdId,
      name: "Home",
      settlementPeriod: "none",
      createdAt: new Date(),
    }),
    findAll: vi.fn(),
    create: vi.fn(),
    updateById: vi.fn(),
    deleteById: vi.fn(),
  };
}

describe("RecurringExpenseService", () => {
  it("listByHousehold throws when household missing", async () => {
    const households: HouseholdRepository = {
      findById: vi.fn().mockResolvedValue(null),
      findAll: vi.fn(),
      create: vi.fn(),
      updateById: vi.fn(),
      deleteById: vi.fn(),
    };
    const service = new RecurringExpenseService(
      {
        findAllByHousehold: vi.fn(),
        findDueByHousehold: vi.fn(),
        findById: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateNextDueDate: vi.fn(),
        deleteById: vi.fn(),
      },
      households,
      { findById: vi.fn(), findAllByHousehold: vi.fn(), create: vi.fn(), deleteById: vi.fn() },
      { findById: vi.fn(), findAllByHousehold: vi.fn(), create: vi.fn(), deleteById: vi.fn() },
      { listByHousehold: vi.fn(), create: vi.fn() } as unknown as ExpenseService,
    );

    await expect(service.listByHousehold(householdId)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("delete throws when recurring expense missing", async () => {
    const households = buildHouseholds();
    const recurring: RecurringExpenseRepository = {
      findAllByHousehold: vi.fn(),
      findDueByHousehold: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
      update: vi.fn(),
      updateNextDueDate: vi.fn(),
      deleteById: vi.fn(),
    };
    const service = new RecurringExpenseService(
      recurring,
      households,
      { findById: vi.fn(), findAllByHousehold: vi.fn(), create: vi.fn(), deleteById: vi.fn() },
      { findById: vi.fn(), findAllByHousehold: vi.fn(), create: vi.fn(), deleteById: vi.fn() } as CategoryRepository,
      { listByHousehold: vi.fn(), create: vi.fn() } as unknown as ExpenseService,
    );

    await expect(service.delete(householdId, recurringId)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("generateDueRecurringExpenses generates at most one expense per due recurring", async () => {
    const households = buildHouseholds();
    const record = buildRecurringRecord({
      nextDueDate: new Date("2026-04-01T00:00:00.000Z"),
    });
    const findDueByHousehold = vi.fn().mockResolvedValue([record]);
    const updateNextDueDate = vi.fn().mockResolvedValue(undefined);
    const createExpense = vi.fn().mockResolvedValue({
      id: "exp1",
      amount: 1000,
      description: "Rent",
      categoryId,
      paidByTenantId: tenantId,
      householdId,
      recurringExpenseId: recurringId,
      splitMode: "custom",
      date: "2026-04-01T00:00:00.000Z",
      createdAt: "2026-06-05T00:00:00.000Z",
    });

    const service = new RecurringExpenseService(
      {
        findAllByHousehold: vi.fn(),
        findDueByHousehold,
        findById: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateNextDueDate,
        deleteById: vi.fn(),
      },
      households,
      { findById: vi.fn(), findAllByHousehold: vi.fn(), create: vi.fn(), deleteById: vi.fn() },
      { findById: vi.fn(), findAllByHousehold: vi.fn(), create: vi.fn(), deleteById: vi.fn() },
      { listByHousehold: vi.fn(), create: createExpense } as unknown as ExpenseService,
    );

    const generated = await service.generateDueRecurringExpenses(householdId);

    expect(findDueByHousehold).toHaveBeenCalledTimes(1);
    expect(generated).toHaveLength(1);
    expect(createExpense).toHaveBeenCalledTimes(1);
    expect(createExpense).toHaveBeenCalledWith(
      expect.objectContaining({
        recurringExpenseId: recurringId,
        date: "2026-04-01",
      }),
    );
    expect(updateNextDueDate).toHaveBeenCalledTimes(1);
    expect(updateNextDueDate).toHaveBeenCalledWith(
      recurringId,
      new Date("2026-05-01T00:00:00.000Z"),
    );
  });

  it("update with startDate change deletes linked expenses and resets nextDueDate", async () => {
    const households = buildHouseholds();
    const existing = buildRecurringRecord({
      startDate: new Date("2026-05-01T00:00:00.000Z"),
      nextDueDate: new Date("2026-06-01T00:00:00.000Z"),
    });
    const deleteByRecurringExpenseId = vi.fn().mockResolvedValue(undefined);
    const countByRecurringExpenseId = vi.fn().mockResolvedValue(0);
    const update = vi.fn().mockResolvedValue({
      ...existing,
      startDate: new Date("2026-07-01T00:00:00.000Z"),
      nextDueDate: new Date("2026-07-01T00:00:00.000Z"),
    });

    const expenseRepo: ExpenseRepository = {
      findById: vi.fn(),
      findAllByHousehold: vi.fn(),
      countByWhere: vi.fn(),
      findPageByWhere: vi.fn(),
      findAllByHouseholdWithSplits: vi.fn(),
      create: vi.fn(),
      updateSplitMode: vi.fn(),
      updateById: vi.fn(),
      deleteById: vi.fn(),
      countByRecurringExpenseId,
      countByRecurringExpenseIds: vi.fn(),
      deleteByRecurringExpenseId,
    };

    const service = new RecurringExpenseService(
      {
        findAllByHousehold: vi.fn(),
        findDueByHousehold: vi.fn(),
        findById: vi.fn().mockResolvedValue(existing),
        create: vi.fn(),
        update,
        updateNextDueDate: vi.fn(),
        deleteById: vi.fn(),
      },
      households,
      { findById: vi.fn().mockResolvedValue({ id: tenantId, householdId }), findAllByHousehold: vi.fn(), create: vi.fn(), deleteById: vi.fn() },
      { findById: vi.fn().mockResolvedValue({ id: categoryId, householdId }), findAllByHousehold: vi.fn(), create: vi.fn(), deleteById: vi.fn() },
      { listByHousehold: vi.fn(), create: vi.fn() } as unknown as ExpenseService,
      expenseRepo,
    );

    await service.update(householdId, recurringId, { startDate: "2026-07-01" });

    expect(deleteByRecurringExpenseId).toHaveBeenCalledWith(recurringId);
    expect(update).toHaveBeenCalledWith(
      recurringId,
      expect.objectContaining({
        startDate: new Date("2026-07-01T00:00:00.000Z"),
        nextDueDate: new Date("2026-07-01T00:00:00.000Z"),
      }),
      undefined,
    );
  });

  it("delete removes linked expenses before deleting recurring row", async () => {
    const households = buildHouseholds();
    const existing = buildRecurringRecord();
    const deleteByRecurringExpenseId = vi.fn().mockResolvedValue(undefined);
    const countByRecurringExpenseId = vi.fn().mockResolvedValue(2);
    const deleteById = vi.fn().mockResolvedValue(existing);

    const expenseRepo: ExpenseRepository = {
      findById: vi.fn(),
      findAllByHousehold: vi.fn(),
      countByWhere: vi.fn(),
      findPageByWhere: vi.fn(),
      findAllByHouseholdWithSplits: vi.fn(),
      create: vi.fn(),
      updateSplitMode: vi.fn(),
      updateById: vi.fn(),
      deleteById: vi.fn(),
      countByRecurringExpenseId,
      countByRecurringExpenseIds: vi.fn(),
      deleteByRecurringExpenseId,
    };

    const service = new RecurringExpenseService(
      {
        findAllByHousehold: vi.fn(),
        findDueByHousehold: vi.fn(),
        findById: vi.fn().mockResolvedValue(existing),
        create: vi.fn(),
        update: vi.fn(),
        updateNextDueDate: vi.fn(),
        deleteById,
      },
      households,
      { findById: vi.fn(), findAllByHousehold: vi.fn(), create: vi.fn(), deleteById: vi.fn() },
      { findById: vi.fn(), findAllByHousehold: vi.fn(), create: vi.fn(), deleteById: vi.fn() },
      { listByHousehold: vi.fn(), create: vi.fn() } as unknown as ExpenseService,
      expenseRepo,
    );

    const result = await service.delete(householdId, recurringId);

    expect(deleteByRecurringExpenseId).toHaveBeenCalledWith(recurringId);
    expect(deleteById).toHaveBeenCalledWith(recurringId);
    expect(result.generatedExpenseCount).toBe(2);
  });

  it("june -> may -> june schedule changes remove linked expenses and zero balances until next generation", async () => {
    const tenantB = "ten22345678901234567890123";
    const rentAmount = 100;
    const households = buildHouseholds();

    interface LinkedExpense {
      id: string;
      recurringExpenseId: string;
      date: string;
      amount: number;
      paidByTenantId: string;
      splits: { tenantId: string; amount: number }[];
    }

    const linkedExpenses: LinkedExpense[] = [];
    let expenseSeq = 0;

    let currentRecord = buildRecurringRecord({
      startDate: new Date("2026-06-01T00:00:00.000Z"),
      nextDueDate: new Date("2026-06-01T00:00:00.000Z"),
      amount: { toNumber: () => rentAmount } as RecurringExpenseWithRelations["amount"],
      splits: [
        {
          id: "split1",
          recurringExpenseId: recurringId,
          tenantId,
          percentage: 50,
          tenant: { id: tenantId, name: "Alice", email: null, householdId, createdAt: new Date() },
        },
        {
          id: "split2",
          recurringExpenseId: recurringId,
          tenantId: tenantB,
          percentage: 50,
          tenant: { id: tenantB, name: "Bob", email: null, householdId, createdAt: new Date() },
        },
      ],
    });

    const balanceFor = (targetTenantId: string): number => {
      const paid = linkedExpenses.reduce(
        (sum, expense) =>
          sum + (expense.paidByTenantId === targetTenantId ? expense.amount : 0),
        0,
      );
      const owed = linkedExpenses
        .flatMap((expense) => expense.splits)
        .filter((split) => split.tenantId === targetTenantId)
        .reduce((sum, split) => sum + split.amount, 0);
      return paid - owed;
    };

    const createExpense = vi.fn().mockImplementation(
      async (input: {
        recurringExpenseId?: string;
        date: string;
        amount: number;
        paidByTenantId: string;
      }) => {
        const id = `exp${++expenseSeq}`;
        const splitAmount = input.amount / 2;
        linkedExpenses.push({
          id,
          recurringExpenseId: input.recurringExpenseId ?? recurringId,
          date: input.date,
          amount: input.amount,
          paidByTenantId: input.paidByTenantId,
          splits: [
            { tenantId, amount: splitAmount },
            { tenantId: tenantB, amount: splitAmount },
          ],
        });
        return { id, ...input };
      },
    );

    const deleteByRecurringExpenseId = vi.fn().mockImplementation(async (id: string) => {
      for (let index = linkedExpenses.length - 1; index >= 0; index -= 1) {
        if (linkedExpenses[index]?.recurringExpenseId === id) {
          linkedExpenses.splice(index, 1);
        }
      }
    });

    const expenseRepo: ExpenseRepository = {
      findById: vi.fn(),
      findAllByHousehold: vi.fn(),
      countByWhere: vi.fn(),
      findPageByWhere: vi.fn(),
      findAllByHouseholdWithSplits: vi.fn(),
      create: vi.fn(),
      updateSplitMode: vi.fn(),
      updateById: vi.fn(),
      deleteById: vi.fn(),
      countByRecurringExpenseId: vi.fn().mockImplementation(async (id: string) =>
        linkedExpenses.filter((expense) => expense.recurringExpenseId === id).length,
      ),
      countByRecurringExpenseIds: vi.fn(),
      deleteByRecurringExpenseId,
    };

    const service = new RecurringExpenseService(
      {
        findAllByHousehold: vi.fn(),
        findDueByHousehold: vi.fn().mockImplementation(async () => {
          const now = new Date("2026-06-04T00:00:00.000Z");
          if (currentRecord.active && currentRecord.nextDueDate <= now) {
            return [currentRecord];
          }
          return [];
        }),
        findById: vi.fn().mockImplementation(async () => currentRecord),
        create: vi.fn(),
        update: vi.fn().mockImplementation(async (_id, data) => {
          currentRecord = { ...currentRecord, ...data };
          return currentRecord;
        }),
        updateNextDueDate: vi.fn().mockImplementation(async (_id, nextDueDate: Date) => {
          currentRecord = { ...currentRecord, nextDueDate };
        }),
        deleteById: vi.fn(),
      },
      households,
      {
        findById: vi.fn().mockImplementation(async (id: string) =>
          id === tenantId || id === tenantB ? { id, householdId } : null,
        ),
        findAllByHousehold: vi.fn(),
        create: vi.fn(),
        deleteById: vi.fn(),
      },
      {
        findById: vi.fn().mockResolvedValue({ id: categoryId, householdId }),
        findAllByHousehold: vi.fn(),
        create: vi.fn(),
        deleteById: vi.fn(),
      },
      { listByHousehold: vi.fn(), create: createExpense } as unknown as ExpenseService,
      expenseRepo,
    );

    await service.generateDueRecurringExpenses(householdId);
    expect(linkedExpenses).toHaveLength(1);
    expect(linkedExpenses[0]?.date).toBe("2026-06-01");
    expect(balanceFor(tenantId)).toBe(50);
    expect(balanceFor(tenantB)).toBe(-50);

    await service.update(householdId, recurringId, { startDate: "2026-05-01" });
    expect(deleteByRecurringExpenseId).toHaveBeenCalledWith(recurringId);
    expect(linkedExpenses).toHaveLength(0);
    expect(balanceFor(tenantId)).toBe(0);
    expect(balanceFor(tenantB)).toBe(0);
    expect(currentRecord.nextDueDate).toEqual(new Date("2026-05-01T00:00:00.000Z"));

    await service.generateDueRecurringExpenses(householdId);
    expect(linkedExpenses).toHaveLength(1);
    expect(linkedExpenses[0]?.date).toBe("2026-05-01");
    expect(balanceFor(tenantId)).toBe(50);
    expect(balanceFor(tenantB)).toBe(-50);

    await service.update(householdId, recurringId, { startDate: "2026-06-01" });
    expect(linkedExpenses).toHaveLength(0);
    expect(balanceFor(tenantId)).toBe(0);
    expect(balanceFor(tenantB)).toBe(0);
    expect(currentRecord.nextDueDate).toEqual(new Date("2026-06-01T00:00:00.000Z"));
  });
});
