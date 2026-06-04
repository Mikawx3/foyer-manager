import type {
  DefaultSplit,
  DefaultSplitRules,
  ResolvedDefaultSplit,
} from "@foyer/types";
import { NotFoundError } from "../errors/app.errors.js";
import { toDefaultSplitDto } from "../lib/mappers.js";
import { assertPercentagesSumTo100 } from "../lib/split-calculator.js";
import {
  categoryRepository,
  type CategoryRepository,
} from "../repositories/category.repository.js";
import {
  defaultSplitRepository,
  type DefaultSplitRepository,
} from "../repositories/default-split.repository.js";
import {
  householdRepository,
  type HouseholdRepository,
} from "../repositories/household.repository.js";
import {
  tenantRepository,
  type TenantRepository,
} from "../repositories/tenant.repository.js";
import type { SetDefaultSplitsInput } from "../validators/default-split.validator.js";

export class DefaultSplitService {
  constructor(
    private readonly repository: DefaultSplitRepository = defaultSplitRepository,
    private readonly households: HouseholdRepository = householdRepository,
    private readonly tenants: TenantRepository = tenantRepository,
    private readonly categories: CategoryRepository = categoryRepository,
  ) {}

  async getRules(householdId: string): Promise<DefaultSplitRules> {
    await this.assertHouseholdExists(householdId);

    const rows = await this.repository.findAllByHousehold(householdId);
    const global: DefaultSplit[] = [];
    const byCategory: Record<string, DefaultSplit[]> = {};

    for (const row of rows) {
      const dto = toDefaultSplitDto(row);
      if (row.categoryId === null) {
        global.push(dto);
      } else {
        const list = byCategory[row.categoryId] ?? [];
        list.push(dto);
        byCategory[row.categoryId] = list;
      }
    }

    return { global, byCategory };
  }

  async setRules(householdId: string, input: SetDefaultSplitsInput): Promise<DefaultSplit[]> {
    await this.assertHouseholdExists(householdId);

    if (input.categoryId !== null) {
      await this.assertCategoryInHousehold(input.categoryId, householdId);
    }

    const percentages = input.splits.map((split) => split.percentage);
    assertPercentagesSumTo100(percentages);

    for (const split of input.splits) {
      await this.assertTenantInHousehold(
        split.tenantId,
        householdId,
        "Split tenant not found in this household",
      );
    }

    const replaced = await this.repository.replaceForScope(
      householdId,
      input.categoryId,
      input.splits,
    );

    return replaced.map(toDefaultSplitDto);
  }

  async resolveForExpense(
    householdId: string,
    categoryId: string,
  ): Promise<ResolvedDefaultSplit[]> {
    await this.assertHouseholdExists(householdId);
    await this.assertCategoryInHousehold(categoryId, householdId);

    const categoryRules = await this.repository.findByHouseholdAndCategory(
      householdId,
      categoryId,
    );

    const rules =
      categoryRules.length > 0
        ? categoryRules
        : await this.repository.findByHouseholdAndCategory(householdId, null);

    return rules.map((rule) => ({
      tenantId: rule.tenantId,
      percentage: rule.percentage,
    }));
  }

  async deleteCategoryRules(householdId: string, categoryId: string): Promise<void> {
    await this.assertHouseholdExists(householdId);
    await this.assertCategoryInHousehold(categoryId, householdId);
    await this.repository.deleteByCategory(householdId, categoryId);
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

export const defaultSplitService = new DefaultSplitService();
