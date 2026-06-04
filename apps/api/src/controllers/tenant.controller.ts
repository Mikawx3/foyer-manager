import type { Context } from "hono";
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
    const tenants = await this.service.listByHousehold(query.householdId);
    return c.json(tenants, 200);
  };

  get = async (c: Context) => {
    const { id } = parseOrThrow(tenantIdParamSchema, c.req.param());
    const tenant = await this.service.getById(id);
    return c.json(tenant, 200);
  };

  create = async (c: Context) => {
    const body = parseOrThrow(createTenantSchema, await c.req.json());
    const tenant = await this.service.create(body);
    return c.json(tenant, 201);
  };

  remove = async (c: Context) => {
    const { id } = parseOrThrow(tenantIdParamSchema, c.req.param());
    const tenant = await this.service.delete(id);
    return c.json(tenant, 200);
  };
}

export const tenantController = new TenantController();
