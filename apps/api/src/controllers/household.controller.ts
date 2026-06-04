import type { Context } from "hono";
import { parseOrThrow } from "../lib/validation.js";
import { expenseService } from "../services/expense.service.js";
import { householdService, type HouseholdService } from "../services/household.service.js";
import {
  createHouseholdSchema,
  householdIdParamSchema,
} from "../validators/household.validator.js";

export class HouseholdController {
  constructor(private readonly service: HouseholdService = householdService) {}

  list = async (c: Context) => {
    const households = await this.service.list();
    return c.json(households, 200);
  };

  get = async (c: Context) => {
    const { id } = parseOrThrow(householdIdParamSchema, c.req.param());
    const household = await this.service.getById(id);
    return c.json(household, 200);
  };

  create = async (c: Context) => {
    const body = parseOrThrow(createHouseholdSchema, await c.req.json());
    const household = await this.service.create(body);
    return c.json(household, 201);
  };

  remove = async (c: Context) => {
    const { id } = parseOrThrow(householdIdParamSchema, c.req.param());
    const household = await this.service.delete(id);
    return c.json(household, 200);
  };

  getBalances = async (c: Context) => {
    const { id } = parseOrThrow(householdIdParamSchema, c.req.param());
    const balances = await expenseService.getBalances(id);
    return c.json(balances, 200);
  };
}

export const householdController = new HouseholdController();
