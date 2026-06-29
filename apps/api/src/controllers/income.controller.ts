import type { Context } from "hono";
import { assertHouseholdAccess } from "../lib/household-access.js";
import { parseOrThrow } from "../lib/validation.js";
import { incomeService, type IncomeService } from "../services/income.service.js";
import {
  createIncomeSchema,
  createIncomeTemplateSchema,
  incomeHouseholdParamSchema,
  incomeParamsSchema,
  incomeStatsQuerySchema,
  incomeTemplateParamsSchema,
  listIncomesQuerySchema,
  updateIncomeSchema,
  updateIncomeTemplateSchema,
} from "../validators/income.validator.js";

export class IncomeController {
  constructor(private readonly service: IncomeService = incomeService) {}

  listTemplates = async (c: Context) => {
    const { id } = parseOrThrow(incomeHouseholdParamSchema, c.req.param());
    assertHouseholdAccess(c, id);
    const templates = await this.service.listTemplatesByHousehold(id);
    return c.json(templates, 200);
  };

  createTemplate = async (c: Context) => {
    const { id } = parseOrThrow(incomeHouseholdParamSchema, c.req.param());
    assertHouseholdAccess(c, id);
    const body = parseOrThrow(createIncomeTemplateSchema, await c.req.json());
    const template = await this.service.createTemplate(id, body);
    return c.json(template, 201);
  };

  updateTemplate = async (c: Context) => {
    const { id, templateId } = parseOrThrow(incomeTemplateParamsSchema, c.req.param());
    assertHouseholdAccess(c, id);
    const body = parseOrThrow(updateIncomeTemplateSchema, await c.req.json());
    const template = await this.service.updateTemplate(id, templateId, body);
    return c.json(template, 200);
  };

  removeTemplate = async (c: Context) => {
    const { id, templateId } = parseOrThrow(incomeTemplateParamsSchema, c.req.param());
    assertHouseholdAccess(c, id);
    const template = await this.service.deleteTemplate(id, templateId);
    return c.json(template, 200);
  };

  list = async (c: Context) => {
    const { id } = parseOrThrow(incomeHouseholdParamSchema, c.req.param());
    assertHouseholdAccess(c, id);
    const query = parseOrThrow(listIncomesQuerySchema, c.req.query());
    const incomes = await this.service.listByHouseholdAndMonth(id, query.month);
    return c.json(incomes, 200);
  };

  create = async (c: Context) => {
    const { id } = parseOrThrow(incomeHouseholdParamSchema, c.req.param());
    assertHouseholdAccess(c, id);
    const body = parseOrThrow(createIncomeSchema, await c.req.json());
    const income = await this.service.create(id, body);
    return c.json(income, 201);
  };

  update = async (c: Context) => {
    const { id, incomeId } = parseOrThrow(incomeParamsSchema, c.req.param());
    assertHouseholdAccess(c, id);
    const body = parseOrThrow(updateIncomeSchema, await c.req.json());
    const income = await this.service.update(id, incomeId, body);
    return c.json(income, 200);
  };

  remove = async (c: Context) => {
    const { id, incomeId } = parseOrThrow(incomeParamsSchema, c.req.param());
    assertHouseholdAccess(c, id);
    const income = await this.service.delete(id, incomeId);
    return c.json(income, 200);
  };

  stats = async (c: Context) => {
    const { id } = parseOrThrow(incomeHouseholdParamSchema, c.req.param());
    assertHouseholdAccess(c, id);
    const query = parseOrThrow(incomeStatsQuerySchema, c.req.query());
    const stats = await this.service.getIncomeStats(id, query.month);
    return c.json(stats, 200);
  };
}

export const incomeController = new IncomeController();
