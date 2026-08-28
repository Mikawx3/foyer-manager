import type { ExpenseStats } from "@foyer/types";
import { NotFoundError } from "../errors/app.errors.js";
import { buildCategoryExpenseStats } from "../lib/expense-stats.js";
import { last6MonthKeys } from "../lib/income-stats.js";
import {
  categoryRepository,
  type CategoryRepository,
} from "../repositories/category.repository.js";
import {
  buildExpenseListWhere,
  type ParticipantScope,
} from "../repositories/expense-list-filters.js";
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

export class ExpenseStatsService {
  constructor(
    private readonly expenses: ExpenseRepository = expenseRepository,
    private readonly categories: CategoryRepository = categoryRepository,
    private readonly households: HouseholdRepository = householdRepository,
    private readonly tenants: TenantRepository = tenantRepository,
  ) {}

  async getStatsForMonth(
    householdId: string,
    month: string,
    participantScope: ParticipantScope = "all",
  ): Promise<ExpenseStats> {
    await this.assertHouseholdExists(householdId);

    const householdTenantIds =
      participantScope === "shared" || participantScope === "personal"
        ? (await this.tenants.findAllByHousehold(householdId)).map((tenant) => tenant.id)
        : [];

    const where = buildExpenseListWhere({
      householdId,
      month,
      participantScope,
      ...(householdTenantIds.length > 0 && { householdTenantIds }),
    });
    const months = last6MonthKeys(month);

    const [totalExpenses, expenseCount, largestExpense, categoryGroups, householdCategories, trendTotals] =
      await Promise.all([
        this.expenses.sumAmountByWhere(where),
        this.expenses.countByWhere(where),
        this.expenses.findLargestExpenseByWhere(where),
        this.expenses.groupByCategoryForWhere(where),
        this.categories.findAllByHousehold(householdId),
        Promise.all(
          months.map(async (trendMonth) => ({
            month: trendMonth,
            total: await this.expenses.sumAmountByWhere(
              buildExpenseListWhere({
                householdId,
                month: trendMonth,
                participantScope,
                ...(householdTenantIds.length > 0 && { householdTenantIds }),
              }),
            ),
          })),
        ),
      ]);

    const byCategory = buildCategoryExpenseStats(
      categoryGroups,
      householdCategories,
      totalExpenses,
    );

    return {
      month,
      totalExpenses,
      expenseCount,
      largestExpense,
      byCategory,
      trend: trendTotals,
    };
  }

  private async assertHouseholdExists(householdId: string): Promise<void> {
    const household = await this.households.findById(householdId);
    if (!household) {
      throw new NotFoundError("Household not found");
    }
  }
}

export const expenseStatsService = new ExpenseStatsService();
