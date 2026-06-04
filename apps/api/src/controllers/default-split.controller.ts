import type { Context } from "hono";
import { parseOrThrow } from "../lib/validation.js";
import {
  defaultSplitService,
  type DefaultSplitService,
} from "../services/default-split.service.js";
import {
  deleteDefaultSplitsQuerySchema,
  resolveDefaultSplitsQuerySchema,
  setDefaultSplitsSchema,
} from "../validators/default-split.validator.js";
import { householdIdParamSchema } from "../validators/household.validator.js";

export class DefaultSplitController {
  constructor(private readonly service: DefaultSplitService = defaultSplitService) {}

  getRules = async (c: Context) => {
    const { id } = parseOrThrow(householdIdParamSchema, c.req.param());
    const rules = await this.service.getRules(id);
    return c.json(rules, 200);
  };

  setRules = async (c: Context) => {
    const { id } = parseOrThrow(householdIdParamSchema, c.req.param());
    const body = parseOrThrow(setDefaultSplitsSchema, await c.req.json());
    const rules = await this.service.setRules(id, body);
    return c.json(rules, 200);
  };

  resolve = async (c: Context) => {
    const { id } = parseOrThrow(householdIdParamSchema, c.req.param());
    const { categoryId } = parseOrThrow(resolveDefaultSplitsQuerySchema, c.req.query());
    const resolved = await this.service.resolveForExpense(id, categoryId);
    return c.json(resolved, 200);
  };

  deleteCategoryRules = async (c: Context) => {
    const { id } = parseOrThrow(householdIdParamSchema, c.req.param());
    const { categoryId } = parseOrThrow(deleteDefaultSplitsQuerySchema, c.req.query());
    await this.service.deleteCategoryRules(id, categoryId);
    return c.body(null, 204);
  };
}

export const defaultSplitController = new DefaultSplitController();
