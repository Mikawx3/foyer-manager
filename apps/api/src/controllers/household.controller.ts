import type { Context } from "hono";
import { parseOrThrow } from "../lib/validation.js";
import { expenseService } from "../services/expense.service.js";
import { householdService, type HouseholdService } from "../services/household.service.js";
import { tenantService, type TenantService } from "../services/tenant.service.js";
import { balancesQuerySchema } from "../validators/household-balances.validator.js";
import {
  createHouseholdSchema,
  householdIdParamSchema,
  updateHouseholdSchema,
} from "../validators/household.validator.js";
import { createNestedTenantSchema } from "../validators/tenant.validator.js";

export class HouseholdController {
  constructor(
    private readonly service: HouseholdService = householdService,
    private readonly tenants: TenantService = tenantService,
  ) {}

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

  update = async (c: Context) => {
    const { id } = parseOrThrow(householdIdParamSchema, c.req.param());
    const body = parseOrThrow(updateHouseholdSchema, await c.req.json());
    const household = await this.service.update(id, body);
    return c.json(household, 200);
  };

  remove = async (c: Context) => {
    const { id } = parseOrThrow(householdIdParamSchema, c.req.param());
    const household = await this.service.delete(id);
    return c.json(household, 200);
  };

  getBalances = async (c: Context) => {
    const { id } = parseOrThrow(householdIdParamSchema, c.req.param());
    const query = parseOrThrow(balancesQuerySchema, c.req.query());
    const balances = await expenseService.getBalances(id, { period: query.period });
    return c.json(balances, 200);
  };

  createTenant = async (c: Context) => {
    const { id } = parseOrThrow(householdIdParamSchema, c.req.param());
    const body = parseOrThrow(createNestedTenantSchema, await c.req.json());
    const tenant = await this.tenants.createForHousehold(id, body);
    return c.json(tenant, 201);
  };
}

export const householdController = new HouseholdController();
