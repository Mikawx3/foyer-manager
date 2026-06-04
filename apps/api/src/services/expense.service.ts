import type { Expense, ExpenseSplit, PaginatedExpenses, TenantBalance } from "@foyer/types";
import { NotFoundError, ValidationError } from "../errors/app.errors.js";
import { decimalToNumber } from "../lib/decimal.js";
import { toExpenseDto, toExpenseSplitDto } from "../lib/mappers.js";
import {
  assertPercentagesSumTo100,
  calculateSplitAmounts,
  computeTenantBalances,
} from "../lib/split-calculator.js";
import {
  categoryRepository,
  type CategoryRepository,
} from "../repositories/category.repository.js";
import {
  expenseSplitRepository,
  type ExpenseSplitRepository,
} from "../repositories/expense-split.repository.js";
import {
  expenseRepository,
  type ExpenseRepository,
} from "../repositories/expense.repository.js";
import {
  householdRepository,
  type HouseholdRepository,
} from "../repositories/household.repository.js";
import {
  tenantRepository,
  type TenantRepository,
} from "../repositories/tenant.repository.js";
import type { AssignSplitsInput } from "../validators/expense-split.validator.js";
import { buildExpenseListWhere } from "../repositories/expense-list-filters.js";
import type { CreateExpenseInput, ListExpensesQuery } from "../validators/expense.validator.js";
import {
  defaultSplitService,
  type DefaultSplitService,
} from "./default-split.service.js";
import type { Expense as PrismaExpense } from "@prisma/client";

export class ExpenseService {
  constructor(
    private readonly expenses: ExpenseRepository = expenseRepository,
    private readonly splits: ExpenseSplitRepository = expenseSplitRepository,
    private readonly households: HouseholdRepository = householdRepository,
    private readonly tenants: TenantRepository = tenantRepository,
    private readonly categories: CategoryRepository = categoryRepository,
    private readonly defaultSplits: DefaultSplitService = defaultSplitService,
  ) {}

  async listByHousehold(query: ListExpensesQuery): Promise<PaginatedExpenses> {
    const { householdId, page, limit, month, categoryId } = query;
    await this.assertHouseholdExists(householdId);

    const where = buildExpenseListWhere({
      householdId,
      ...(month !== undefined && { month }),
      ...(categoryId !== undefined && { categoryId }),
    });

    const total = await this.expenses.countByWhere(where);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const skip = (page - 1) * limit;
    const items = await this.expenses.findPageByWhere(where, { skip, take: limit });

    return {
      data: items.map(toExpenseDto),
      total,
      page,
      totalPages,
    };
  }

  async getById(id: string): Promise<Expense> {
    const expense = await this.expenses.findById(id);
    if (!expense) {
      throw new NotFoundError("Expense not found");
    }
    return toExpenseDto(expense);
  }

  async create(input: CreateExpenseInput): Promise<Expense> {
    await this.assertHouseholdExists(input.householdId);
    await this.assertCategoryInHousehold(input.categoryId, input.householdId);
    await this.assertTenantInHousehold(
      input.paidByTenantId,
      input.householdId,
      "Payer tenant not found in this household",
    );

    const splitMode = input.splitMode ?? "default";

    const expense = await this.expenses.create({
      amount: input.amount,
      description: input.description,
      categoryId: input.categoryId,
      paidByTenantId: input.paidByTenantId,
      householdId: input.householdId,
      date: new Date(`${input.date}T00:00:00.000Z`),
      splitMode,
    });

    if (splitMode === "custom" && input.splits) {
      await this.applyPercentagesToExpense(expense, input.splits);
      return toExpenseDto(expense);
    }

    const resolved = await this.defaultSplits.resolveForExpense(
      input.householdId,
      input.categoryId,
    );

    if (resolved.length > 0) {
      await this.applyPercentagesToExpense(expense, resolved);
    }

    return toExpenseDto(expense);
  }

  async delete(id: string): Promise<Expense> {
    const expense = await this.expenses.deleteById(id);
    return toExpenseDto(expense);
  }

  async assignSplits(
    expenseId: string,
    input: AssignSplitsInput,
  ): Promise<ExpenseSplit[]> {
    const expense = await this.expenses.findById(expenseId);
    if (!expense) {
      throw new NotFoundError("Expense not found");
    }

    const percentages = input.splits.map((split) => split.percentage);
    assertPercentagesSumTo100(percentages);

    for (const split of input.splits) {
      await this.assertTenantInHousehold(
        split.tenantId,
        expense.householdId,
        "Split tenant not found in this household",
      );
    }

    const replaced = await this.applyPercentagesToExpense(expense, input.splits);
    await this.expenses.updateSplitMode(expenseId, "custom");

    return replaced;
  }

  async resetSplitsToDefault(expenseId: string): Promise<ExpenseSplit[]> {
    const expense = await this.expenses.findById(expenseId);
    if (!expense) {
      throw new NotFoundError("Expense not found");
    }

    const resolved = await this.defaultSplits.resolveForExpense(
      expense.householdId,
      expense.categoryId,
    );

    if (resolved.length === 0) {
      throw new ValidationError(
        "No default split rules configured for this expense category",
      );
    }

    const replaced = await this.applyPercentagesToExpense(expense, resolved);
    await this.expenses.updateSplitMode(expenseId, "default");

    return replaced;
  }

  async getSplits(expenseId: string): Promise<ExpenseSplit[]> {
    const expense = await this.expenses.findById(expenseId);
    if (!expense) {
      throw new NotFoundError("Expense not found");
    }
    const items = await this.splits.findByExpenseId(expenseId);
    return items.map(toExpenseSplitDto);
  }

  async getBalances(householdId: string): Promise<TenantBalance[]> {
    await this.assertHouseholdExists(householdId);

    const tenants = await this.tenants.findAllByHousehold(householdId);
    const expensesWithSplits =
      await this.expenses.findAllByHouseholdWithSplits(householdId);

    const expenses = expensesWithSplits.map((expense) => ({
      paidByTenantId: expense.paidByTenantId,
      amount: decimalToNumber(expense.amount),
    }));

    const splits = expensesWithSplits.flatMap((expense) =>
      expense.splits.map((split) => ({
        tenantId: split.tenantId,
        amount: decimalToNumber(split.amount),
      })),
    );

    return computeTenantBalances(
      tenants.map((tenant) => ({ id: tenant.id })),
      expenses,
      splits,
    );
  }

  private async applyPercentagesToExpense(
    expense: PrismaExpense,
    splits: { tenantId: string; percentage: number }[],
  ): Promise<ExpenseSplit[]> {
    const percentages = splits.map((split) => split.percentage);
    assertPercentagesSumTo100(percentages);

    const total = decimalToNumber(expense.amount);
    const amounts = calculateSplitAmounts(total, percentages);

    const replaced = await this.splits.replaceForExpense(
      expense.id,
      splits.map((split, index) => {
        const amount = amounts[index];
        if (amount === undefined) {
          throw new ValidationError("Failed to calculate split amounts");
        }
        return {
          tenantId: split.tenantId,
          amount,
          percentage: split.percentage,
        };
      }),
    );

    return replaced.map(toExpenseSplitDto);
  }

  private async assertHouseholdExists(householdId: string): Promise<void> {
    const household = await this.households.findById(householdId);
    if (!household) {
      throw new NotFoundError("Household not found");
    }
  }

  private async assertCategoryInHousehold(
    categoryId: string,
    householdId: string,
  ): Promise<void> {
    const category = await this.categories.findById(categoryId);
    if (!category || category.householdId !== householdId) {
      throw new NotFoundError("Category not found in this household");
    }
  }

  private async assertTenantInHousehold(
    tenantId: string,
    householdId: string,
    message: string,
  ): Promise<void> {
    const tenant = await this.tenants.findById(tenantId);
    if (!tenant || tenant.householdId !== householdId) {
      throw new NotFoundError(message);
    }
  }
}

export const expenseService = new ExpenseService();
