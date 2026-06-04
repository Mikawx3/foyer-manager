import type { Context } from "hono";
import { parseOrThrow } from "../lib/validation.js";
import { expenseService, type ExpenseService } from "../services/expense.service.js";
import { assignSplitsSchema } from "../validators/expense-split.validator.js";
import {
  createExpenseSchema,
  expenseIdParamSchema,
  listExpensesQuerySchema,
} from "../validators/expense.validator.js";

export class ExpenseController {
  constructor(private readonly service: ExpenseService = expenseService) {}

  list = async (c: Context) => {
    const query = parseOrThrow(listExpensesQuerySchema, c.req.query());
    const expenses = await this.service.listByHousehold(query);
    return c.json(expenses, 200);
  };

  get = async (c: Context) => {
    const { id } = parseOrThrow(expenseIdParamSchema, c.req.param());
    const expense = await this.service.getById(id);
    return c.json(expense, 200);
  };

  create = async (c: Context) => {
    const body = parseOrThrow(createExpenseSchema, await c.req.json());
    const expense = await this.service.create(body);
    return c.json(expense, 201);
  };

  remove = async (c: Context) => {
    const { id } = parseOrThrow(expenseIdParamSchema, c.req.param());
    const expense = await this.service.delete(id);
    return c.json(expense, 200);
  };

  assignSplits = async (c: Context) => {
    const { id } = parseOrThrow(expenseIdParamSchema, c.req.param());
    const body = parseOrThrow(assignSplitsSchema, await c.req.json());
    const splits = await this.service.assignSplits(id, body);
    return c.json(splits, 201);
  };

  getSplits = async (c: Context) => {
    const { id } = parseOrThrow(expenseIdParamSchema, c.req.param());
    const splits = await this.service.getSplits(id);
    return c.json(splits, 200);
  };

  resetSplits = async (c: Context) => {
    const { id } = parseOrThrow(expenseIdParamSchema, c.req.param());
    const splits = await this.service.resetSplitsToDefault(id);
    return c.json(splits, 200);
  };
}

export const expenseController = new ExpenseController();
