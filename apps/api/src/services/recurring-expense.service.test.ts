import { describe, expect, it, vi } from "vitest";
import { NotFoundError } from "../errors/app.errors.js";
import type { CategoryRepository } from "../repositories/category.repository.js";
import type { HouseholdRepository } from "../repositories/household.repository.js";
import type { RecurringExpenseRepository } from "../repositories/recurring-expense.repository.js";
import type { TenantRepository } from "../repositories/tenant.repository.js";
import type { ExpenseService } from "./expense.service.js";
import { RecurringExpenseService } from "./recurring-expense.service.js";

const householdId = "clh12345678901234567890123";
const recurringId = "cre12345678901234567890123";

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
      { findAllByHousehold: vi.fn(), findDueByHousehold: vi.fn(), findById: vi.fn(), create: vi.fn(), update: vi.fn(), updateNextDueDate: vi.fn(), deleteById: vi.fn() },
      households,
      { findById: vi.fn(), findAllByHousehold: vi.fn(), create: vi.fn(), deleteById: vi.fn() },
      { findById: vi.fn(), findAllByHousehold: vi.fn(), create: vi.fn(), deleteById: vi.fn() },
      { listByHousehold: vi.fn(), create: vi.fn() } as unknown as ExpenseService,
    );

    await expect(service.listByHousehold(householdId)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("delete throws when recurring expense missing", async () => {
    const households: HouseholdRepository = {
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
});
