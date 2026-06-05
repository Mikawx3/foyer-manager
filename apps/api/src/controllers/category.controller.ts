import type { Context } from "hono";
import { NotFoundError } from "../errors/app.errors.js";
import { assertHouseholdAccess } from "../lib/household-access.js";
import { parseOrThrow } from "../lib/validation.js";
import { categoryRepository } from "../repositories/category.repository.js";
import { categoryService, type CategoryService } from "../services/category.service.js";
import {
  categoryIdParamSchema,
  createCategorySchema,
  listCategoriesQuerySchema,
} from "../validators/category.validator.js";

export class CategoryController {
  constructor(private readonly service: CategoryService = categoryService) {}

  list = async (c: Context) => {
    const query = parseOrThrow(listCategoriesQuerySchema, c.req.query());
    assertHouseholdAccess(c, query.householdId);
    const categories = await this.service.listByHousehold(query.householdId);
    return c.json(categories, 200);
  };

  create = async (c: Context) => {
    const body = parseOrThrow(createCategorySchema, await c.req.json());
    assertHouseholdAccess(c, body.householdId);
    const category = await this.service.create(body);
    return c.json(category, 201);
  };

  remove = async (c: Context) => {
    const { id } = parseOrThrow(categoryIdParamSchema, c.req.param());
    const existing = await categoryRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Category not found");
    }
    assertHouseholdAccess(c, existing.householdId);
    const category = await this.service.delete(id);
    return c.json(category, 200);
  };
}

export const categoryController = new CategoryController();
