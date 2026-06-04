import type { Category } from "@foyer/types";
import { NotFoundError, ValidationError } from "../errors/app.errors.js";
import { toCategoryDto } from "../lib/mappers.js";
import {
  categoryRepository,
  type CategoryRepository,
} from "../repositories/category.repository.js";
import {
  householdRepository,
  type HouseholdRepository,
} from "../repositories/household.repository.js";

export class CategoryService {
  constructor(
    private readonly repository: CategoryRepository = categoryRepository,
    private readonly households: HouseholdRepository = householdRepository,
  ) {}

  async listByHousehold(householdId: string): Promise<Category[]> {
    const household = await this.households.findById(householdId);
    if (!household) {
      throw new NotFoundError("Household not found");
    }
    const categories = await this.repository.findAllByHousehold(householdId);
    return categories.map(toCategoryDto);
  }

  async create(data: { name: string; householdId: string }): Promise<Category> {
    const household = await this.households.findById(data.householdId);
    if (!household) {
      throw new NotFoundError("Household not found");
    }
    const category = await this.repository.create(data);
    return toCategoryDto(category);
  }

  async delete(id: string): Promise<Category> {
    const category = await this.repository.findById(id);
    if (!category) {
      throw new NotFoundError("Category not found");
    }

    const expenseCount = await this.repository.countExpenses(id);
    if (expenseCount > 0) {
      throw new ValidationError("Category has expenses and cannot be deleted");
    }

    const deleted = await this.repository.deleteById(id);
    return toCategoryDto(deleted);
  }
}

export const categoryService = new CategoryService();
