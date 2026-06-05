import type { Expense, RecurringExpense, RecurringFrequency } from "@foyer/types";
import { NotFoundError, ValidationError } from "../errors/app.errors.js";
import { decimalToNumber } from "../lib/decimal.js";
import { getNextDueDate } from "../lib/next-due-date.js";
import {
  categoryRepository,
  type CategoryRepository,
} from "../repositories/category.repository.js";
import {
  expenseRepository,
  type ExpenseRepository,
} from "../repositories/expense.repository.js";
import {
  householdRepository,
  type HouseholdRepository,
} from "../repositories/household.repository.js";
import {
  recurringExpenseRepository,
  type RecurringExpenseRepository,
  type RecurringExpenseWithRelations,
} from "../repositories/recurring-expense.repository.js";
import {
  tenantRepository,
  type TenantRepository,
} from "../repositories/tenant.repository.js";
import type {
  CreateRecurringExpenseInput,
  UpdateRecurringExpenseInput,
} from "../validators/recurring-expense.validator.js";
import { expenseService, type ExpenseService } from "./expense.service.js";

function toRecurringExpenseDto(
  record: RecurringExpenseWithRelations,
  generatedExpenseCount: number,
): RecurringExpense {
  return {
    id: record.id,
    householdId: record.householdId,
    title: record.title,
    amount: decimalToNumber(record.amount),
    ...(record.category !== null && { category: record.category }),
    paidById: record.paidById,
    paidBy: { id: record.paidBy.id, name: record.paidBy.name },
    frequency: record.frequency as RecurringFrequency,
    startDate: record.startDate.toISOString(),
    nextDueDate: record.nextDueDate.toISOString(),
    active: record.active,
    splits: record.splits.map((split) => ({
      tenantId: split.tenantId,
      tenant: { id: split.tenant.id, name: split.tenant.name },
      percentage: split.percentage,
    })),
    generatedExpenseCount,
    createdAt: record.createdAt.toISOString(),
  };
}

export class RecurringExpenseService {
  constructor(
    private readonly recurring: RecurringExpenseRepository = recurringExpenseRepository,
    private readonly households: HouseholdRepository = householdRepository,
    private readonly tenants: TenantRepository = tenantRepository,
    private readonly categories: CategoryRepository = categoryRepository,
    private readonly expenses: ExpenseService = expenseService,
    private readonly expenseRepo: ExpenseRepository = expenseRepository,
  ) {}

  async listByHousehold(householdId: string): Promise<RecurringExpense[]> {
    await this.assertHouseholdExists(householdId);
    const items = await this.recurring.findAllByHousehold(householdId);
    const counts = await this.expenseRepo.countByRecurringExpenseIds(
      items.map((item) => item.id),
    );
    return items.map((item) =>
      toRecurringExpenseDto(item, counts.get(item.id) ?? 0),
    );
  }

  async create(householdId: string, input: CreateRecurringExpenseInput): Promise<RecurringExpense> {
    await this.assertHouseholdExists(householdId);
    await this.assertPaidByInHousehold(input.paidById, householdId);
    await this.validateSplits(input.splits, householdId);
    if (input.category !== undefined) {
      await this.assertCategoryInHousehold(input.category, householdId);
    }

    const startDate = new Date(`${input.startDate}T00:00:00.000Z`);
    const created = await this.recurring.create({
      householdId,
      title: input.title,
      amount: input.amount,
      category: input.category,
      paidById: input.paidById,
      frequency: input.frequency,
      startDate,
      nextDueDate: startDate,
      splits: input.splits,
    });

    return toRecurringExpenseDto(created, 0);
  }

  async update(
    householdId: string,
    recurringId: string,
    input: UpdateRecurringExpenseInput,
  ): Promise<RecurringExpense> {
    await this.assertHouseholdExists(householdId);
    const existing = await this.getRecurringInHousehold(recurringId, householdId);

    if (input.paidById !== undefined) {
      await this.assertPaidByInHousehold(input.paidById, householdId);
    }
    if (input.splits !== undefined) {
      await this.validateSplits(input.splits, householdId);
    }
    if (input.category !== undefined && input.category !== null) {
      await this.assertCategoryInHousehold(input.category, householdId);
    }

    const existingStartDate = existing.startDate.toISOString().slice(0, 10);
    const scheduleChanged =
      (input.startDate !== undefined && input.startDate !== existingStartDate) ||
      (input.frequency !== undefined && input.frequency !== existing.frequency);

    if (scheduleChanged) {
      await this.expenseRepo.deleteByRecurringExpenseId(recurringId);
    }

    const frequency = (input.frequency ?? existing.frequency) as RecurringFrequency;
    const startDate =
      input.startDate !== undefined
        ? new Date(`${input.startDate}T00:00:00.000Z`)
        : existing.startDate;
    const nextDueDate =
      input.nextDueDate !== undefined
        ? new Date(`${input.nextDueDate}T00:00:00.000Z`)
        : scheduleChanged
          ? startDate
          : existing.nextDueDate;

    const updated = await this.recurring.update(
      recurringId,
      {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.amount !== undefined && { amount: input.amount }),
        ...(input.category !== undefined && { category: input.category }),
        ...(input.paidById !== undefined && { paidById: input.paidById }),
        ...(input.frequency !== undefined && { frequency: input.frequency }),
        ...(input.active !== undefined && { active: input.active }),
        startDate,
        nextDueDate,
      },
      input.splits,
    );

    const generatedExpenseCount = await this.expenseRepo.countByRecurringExpenseId(recurringId);
    return toRecurringExpenseDto(updated, generatedExpenseCount);
  }

  async delete(householdId: string, recurringId: string): Promise<RecurringExpense> {
    await this.assertHouseholdExists(householdId);
    const existing = await this.getRecurringInHousehold(recurringId, householdId);
    const generatedExpenseCount = await this.expenseRepo.countByRecurringExpenseId(recurringId);
    const dto = toRecurringExpenseDto(existing, generatedExpenseCount);
    await this.expenseRepo.deleteByRecurringExpenseId(recurringId);
    await this.recurring.deleteById(recurringId);
    return dto;
  }

  async generateOne(householdId: string, recurringId: string): Promise<Expense> {
    await this.assertHouseholdExists(householdId);
    const record = await this.getRecurringInHousehold(recurringId, householdId);
    const expense = await this.generateExpenseFromRecord(record);
    await this.recurring.updateNextDueDate(
      record.id,
      getNextDueDate(record.nextDueDate, record.frequency as RecurringFrequency),
    );
    return expense;
  }

  async generateDueRecurringExpenses(householdId: string): Promise<Expense[]> {
    await this.assertHouseholdExists(householdId);
    const generated: Expense[] = [];
    const now = new Date();
    const dueItems = await this.recurring.findDueByHousehold(householdId, now);

    for (const record of dueItems) {
      const existing = await this.expenseRepo.findByRecurringExpenseAndDate(
        record.id,
        record.nextDueDate,
      );
      if (existing) {
        await this.recurring.updateNextDueDate(
          record.id,
          getNextDueDate(record.nextDueDate, record.frequency as RecurringFrequency),
        );
        continue;
      }

      const expense = await this.generateExpenseFromRecord(record);
      generated.push(expense);
      await this.recurring.updateNextDueDate(
        record.id,
        getNextDueDate(record.nextDueDate, record.frequency as RecurringFrequency),
      );
    }

    return generated;
  }

  private async generateExpenseFromRecord(
    record: RecurringExpenseWithRelations,
  ): Promise<Expense> {
    if (!record.category) {
      throw new ValidationError("Recurring expense must have a category to generate an expense");
    }

    const dateIso = record.nextDueDate.toISOString().slice(0, 10);

    return this.expenses.create({
      householdId: record.householdId,
      amount: decimalToNumber(record.amount),
      description: record.title,
      categoryId: record.category,
      paidByTenantId: record.paidById,
      date: dateIso,
      splitMode: "custom",
      recurringExpenseId: record.id,
      splits: record.splits.map((split) => ({
        tenantId: split.tenantId,
        percentage: split.percentage,
      })),
    });
  }

  private async getRecurringInHousehold(
    recurringId: string,
    householdId: string,
  ): Promise<RecurringExpenseWithRelations> {
    const record = await this.recurring.findById(recurringId);
    if (!record || record.householdId !== householdId) {
      throw new NotFoundError("Recurring expense not found");
    }
    return record;
  }

  private async assertHouseholdExists(householdId: string): Promise<void> {
    const household = await this.households.findById(householdId);
    if (!household) {
      throw new NotFoundError("Household not found");
    }
  }

  private async assertPaidByInHousehold(
    paidById: string,
    householdId: string,
  ): Promise<void> {
    const tenant = await this.tenants.findById(paidById);
    if (!tenant || tenant.householdId !== householdId) {
      throw new ValidationError("Payer does not belong to this household");
    }
  }

  private async assertCategoryInHousehold(
    categoryId: string,
    householdId: string,
  ): Promise<void> {
    const category = await this.categories.findById(categoryId);
    if (!category || category.householdId !== householdId) {
      throw new ValidationError("Category does not belong to this household");
    }
  }

  private async validateSplits(
    splits: { tenantId: string; percentage: number }[],
    householdId: string,
  ): Promise<void> {
    for (const split of splits) {
      await this.assertPaidByInHousehold(split.tenantId, householdId);
    }
  }
}

export const recurringExpenseService = new RecurringExpenseService();
