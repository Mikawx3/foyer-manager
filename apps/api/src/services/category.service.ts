import type { Category } from "@foyer/types";
import { NotFoundError } from "../errors/app.errors.js";
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
}

export const categoryService = new CategoryService();
