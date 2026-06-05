import type { Context } from "hono";
import { assertHouseholdAccess } from "../lib/household-access.js";
import { parseOrThrow } from "../lib/validation.js";
import { tenantService, type TenantService } from "../services/tenant.service.js";
import {
  createTenantSchema,
  listTenantsQuerySchema,
  tenantIdParamSchema,
} from "../validators/tenant.validator.js";

export class TenantController {
  constructor(private readonly service: TenantService = tenantService) {}

  list = async (c: Context) => {
    const query = parseOrThrow(listTenantsQuerySchema, c.req.query());
    assertHouseholdAccess(c, query.householdId);
    const tenants = await this.service.listByHousehold(query.householdId, {
      includeArchived: query.includeArchived,
    });
    return c.json(tenants, 200);
  };

  get = async (c: Context) => {
    const { id } = parseOrThrow(tenantIdParamSchema, c.req.param());
    const tenant = await this.service.getById(id);
    assertHouseholdAccess(c, tenant.householdId);
    return c.json(tenant, 200);
  };

  create = async (c: Context) => {
    const body = parseOrThrow(createTenantSchema, await c.req.json());
    assertHouseholdAccess(c, body.householdId);
    const tenant = await this.service.create(body);
    return c.json(tenant, 201);
  };

  remove = async (c: Context) => {
    const { id } = parseOrThrow(tenantIdParamSchema, c.req.param());
    const tenant = await this.service.getById(id);
    assertHouseholdAccess(c, tenant.householdId);
    const removed = await this.service.delete(id);
    return c.json(removed, 200);
  };
}

export const tenantController = new TenantController();
