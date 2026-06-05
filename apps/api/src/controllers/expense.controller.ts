import type { Context } from "hono";
import { assertHouseholdAccess } from "../lib/household-access.js";
import { parseOrThrow } from "../lib/validation.js";
import { expenseService, type ExpenseService } from "../services/expense.service.js";
import {
  recurringExpenseService,
  type RecurringExpenseService,
} from "../services/recurring-expense.service.js";
import { assignSplitsSchema } from "../validators/expense-split.validator.js";
import {
  createExpenseSchema,
  expenseIdParamSchema,
  listExpensesQuerySchema,
  updateExpenseSchema,
} from "../validators/expense.validator.js";

export class ExpenseController {
  constructor(
    private readonly service: ExpenseService = expenseService,
    private readonly recurring: RecurringExpenseService = recurringExpenseService,
  ) {}

  list = async (c: Context) => {
    const query = parseOrThrow(listExpensesQuerySchema, c.req.query());
    assertHouseholdAccess(c, query.householdId);
    const generated = await this.recurring.generateDueRecurringExpenses(query.householdId);
    const expenses = await this.service.listByHousehold(query);
    return c.json({ ...expenses, recurringGeneratedCount: generated.length }, 200);
  };

  get = async (c: Context) => {
    const { id } = parseOrThrow(expenseIdParamSchema, c.req.param());
    const expense = await this.service.getById(id);
    assertHouseholdAccess(c, expense.householdId);
    return c.json(expense, 200);
  };

  create = async (c: Context) => {
    const body = parseOrThrow(createExpenseSchema, await c.req.json());
    assertHouseholdAccess(c, body.householdId);
    const expense = await this.service.create(body);
    return c.json(expense, 201);
  };

  update = async (c: Context) => {
    const { id } = parseOrThrow(expenseIdParamSchema, c.req.param());
    const existing = await this.service.getById(id);
    assertHouseholdAccess(c, existing.householdId);
    const body = parseOrThrow(updateExpenseSchema, await c.req.json());
    const expense = await this.service.update(id, body);
    return c.json(expense, 200);
  };

  remove = async (c: Context) => {
    const { id } = parseOrThrow(expenseIdParamSchema, c.req.param());
    const existing = await this.service.getById(id);
    assertHouseholdAccess(c, existing.householdId);
    const expense = await this.service.delete(id);
    return c.json(expense, 200);
  };

  assignSplits = async (c: Context) => {
    const { id } = parseOrThrow(expenseIdParamSchema, c.req.param());
    const existing = await this.service.getById(id);
    assertHouseholdAccess(c, existing.householdId);
    const body = parseOrThrow(assignSplitsSchema, await c.req.json());
    const splits = await this.service.assignSplits(id, body);
    return c.json(splits, 201);
  };

  getSplits = async (c: Context) => {
    const { id } = parseOrThrow(expenseIdParamSchema, c.req.param());
    const existing = await this.service.getById(id);
    assertHouseholdAccess(c, existing.householdId);
    const splits = await this.service.getSplits(id);
    return c.json(splits, 200);
  };

  resetSplits = async (c: Context) => {
    const { id } = parseOrThrow(expenseIdParamSchema, c.req.param());
    const existing = await this.service.getById(id);
    assertHouseholdAccess(c, existing.householdId);
    const splits = await this.service.resetSplitsToDefault(id);
    return c.json(splits, 200);
  };
}

export const expenseController = new ExpenseController();
