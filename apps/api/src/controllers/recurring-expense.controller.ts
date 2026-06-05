import type { Context } from "hono";
import { assertHouseholdAccess } from "../lib/household-access.js";
import { parseOrThrow } from "../lib/validation.js";
import {
  recurringExpenseService,
  type RecurringExpenseService,
} from "../services/recurring-expense.service.js";
import {
  createRecurringExpenseSchema,
  recurringExpenseHouseholdParamSchema,
  recurringExpenseParamsSchema,
  updateRecurringExpenseSchema,
} from "../validators/recurring-expense.validator.js";

export class RecurringExpenseController {
  constructor(private readonly service: RecurringExpenseService = recurringExpenseService) {}

  list = async (c: Context) => {
    const { id } = parseOrThrow(recurringExpenseHouseholdParamSchema, c.req.param());
    assertHouseholdAccess(c, id);
    const items = await this.service.listByHousehold(id);
    return c.json(items, 200);
  };

  create = async (c: Context) => {
    const { id } = parseOrThrow(recurringExpenseHouseholdParamSchema, c.req.param());
    assertHouseholdAccess(c, id);
    const body = parseOrThrow(createRecurringExpenseSchema, await c.req.json());
    const item = await this.service.create(id, body);
    return c.json(item, 201);
  };

  update = async (c: Context) => {
    const { id, recurringId } = parseOrThrow(recurringExpenseParamsSchema, c.req.param());
    assertHouseholdAccess(c, id);
    const body = parseOrThrow(updateRecurringExpenseSchema, await c.req.json());
    const item = await this.service.update(id, recurringId, body);
    return c.json(item, 200);
  };

  remove = async (c: Context) => {
    const { id, recurringId } = parseOrThrow(recurringExpenseParamsSchema, c.req.param());
    assertHouseholdAccess(c, id);
    const item = await this.service.delete(id, recurringId);
    return c.json(item, 200);
  };

  generate = async (c: Context) => {
    const { id, recurringId } = parseOrThrow(recurringExpenseParamsSchema, c.req.param());
    assertHouseholdAccess(c, id);
    const expense = await this.service.generateOne(id, recurringId);
    return c.json(expense, 201);
  };
}

export const recurringExpenseController = new RecurringExpenseController();
