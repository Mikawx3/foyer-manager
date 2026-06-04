import type { Context } from "hono";
import { parseOrThrow } from "../lib/validation.js";
import { categoryService, type CategoryService } from "../services/category.service.js";
import {
  createCategorySchema,
  listCategoriesQuerySchema,
} from "../validators/category.validator.js";

export class CategoryController {
  constructor(private readonly service: CategoryService = categoryService) {}

  list = async (c: Context) => {
    const query = parseOrThrow(listCategoriesQuerySchema, c.req.query());
    const categories = await this.service.listByHousehold(query.householdId);
    return c.json(categories, 200);
  };

  create = async (c: Context) => {
    const body = parseOrThrow(createCategorySchema, await c.req.json());
    const category = await this.service.create(body);
    return c.json(category, 201);
  };
}

export const categoryController = new CategoryController();
