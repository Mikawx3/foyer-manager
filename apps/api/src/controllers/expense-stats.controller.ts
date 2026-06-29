import type { Context } from "hono";
import { assertHouseholdAccess } from "../lib/household-access.js";
import { parseOrThrow } from "../lib/validation.js";
import {
  expenseStatsService,
  type ExpenseStatsService,
} from "../services/expense-stats.service.js";
import {
  expenseStatsHouseholdParamSchema,
  expenseStatsQuerySchema,
} from "../validators/expense-stats.validator.js";

export class ExpenseStatsController {
  constructor(private readonly service: ExpenseStatsService = expenseStatsService) {}

  stats = async (c: Context) => {
    const { id } = parseOrThrow(expenseStatsHouseholdParamSchema, c.req.param());
    assertHouseholdAccess(c, id);
    const query = parseOrThrow(expenseStatsQuerySchema, c.req.query());
    const stats = await this.service.getStatsForMonth(id, query.month);
    return c.json(stats, 200);
  };
}

export const expenseStatsController = new ExpenseStatsController();
