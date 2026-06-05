import type { Context } from "hono";
import { ConflictError } from "../errors/app.errors.js";
import { assertHouseholdAccess } from "../lib/household-access.js";
import { isLocalDeployment } from "../lib/deployment.js";
import { getAuth } from "../middleware/auth.middleware.js";
import { parseOrThrow } from "../lib/validation.js";
import { expenseService } from "../services/expense.service.js";
import { householdService, type HouseholdService } from "../services/household.service.js";
import { tenantService, type TenantService } from "../services/tenant.service.js";
import { balancesQuerySchema } from "../validators/household-balances.validator.js";
import {
  createHouseholdSchema,
  householdIdParamSchema,
  householdTenantParamsSchema,
  updateHouseholdSchema,
} from "../validators/household.validator.js";
import {
  createNestedTenantSchema,
  householdListTenantsQuerySchema,
  updateTenantSchema,
} from "../validators/tenant.validator.js";

export class HouseholdController {
  constructor(
    private readonly service: HouseholdService = householdService,
    private readonly tenants: TenantService = tenantService,
  ) {}

  list = async (c: Context) => {
    if (isLocalDeployment()) {
      const households = await this.service.list();
      return c.json(households, 200);
    }

    const auth = getAuth(c);
    const household = await this.service.getById(auth.householdId);
    return c.json([household], 200);
  };

  get = async (c: Context) => {
    const { id } = parseOrThrow(householdIdParamSchema, c.req.param());
    assertHouseholdAccess(c, id);
    const household = await this.service.getById(id);
    return c.json(household, 200);
  };

  create = async (c: Context) => {
    const body = parseOrThrow(createHouseholdSchema, await c.req.json());

    if (isLocalDeployment()) {
      const household = await this.service.create(body);
      return c.json(household, 201);
    }

    const auth = getAuth(c);
    await this.service.getById(auth.householdId);
    throw new ConflictError("User already has a household");
  };

  update = async (c: Context) => {
    const { id } = parseOrThrow(householdIdParamSchema, c.req.param());
    assertHouseholdAccess(c, id);
    const body = parseOrThrow(updateHouseholdSchema, await c.req.json());
    const household = await this.service.update(id, body);
    return c.json(household, 200);
  };

  remove = async (c: Context) => {
    const { id } = parseOrThrow(householdIdParamSchema, c.req.param());
    assertHouseholdAccess(c, id);
    const household = await this.service.delete(id);
    return c.json(household, 200);
  };

  getDeletionPreview = async (c: Context) => {
    const { id } = parseOrThrow(householdIdParamSchema, c.req.param());
    assertHouseholdAccess(c, id);
    const preview = await this.service.getDeletionPreview(id);
    return c.json(preview, 200);
  };

  getBalances = async (c: Context) => {
    const { id } = parseOrThrow(householdIdParamSchema, c.req.param());
    assertHouseholdAccess(c, id);
    const query = parseOrThrow(balancesQuerySchema, c.req.query());
    const balances = await expenseService.getBalances(id, { period: query.period });
    return c.json(balances, 200);
  };

  createTenant = async (c: Context) => {
    const { id } = parseOrThrow(householdIdParamSchema, c.req.param());
    assertHouseholdAccess(c, id);
    const body = parseOrThrow(createNestedTenantSchema, await c.req.json());
    const tenant = await this.tenants.createForHousehold(id, body);
    return c.json(tenant, 201);
  };

  listTenants = async (c: Context) => {
    const { id } = parseOrThrow(householdIdParamSchema, c.req.param());
    assertHouseholdAccess(c, id);
    const query = parseOrThrow(householdListTenantsQuerySchema, c.req.query());
    const tenants = await this.tenants.listByHousehold(id, {
      includeArchived: query.includeArchived,
    });
    return c.json(tenants, 200);
  };

  updateTenant = async (c: Context) => {
    const { id, tenantId } = parseOrThrow(householdTenantParamsSchema, c.req.param());
    assertHouseholdAccess(c, id);
    const body = parseOrThrow(updateTenantSchema, await c.req.json());
    const result = await this.tenants.updateFromHousehold(id, tenantId, body);
    return c.json(result, 200);
  };

  removeTenant = async (c: Context) => {
    const { id, tenantId } = parseOrThrow(householdTenantParamsSchema, c.req.param());
    assertHouseholdAccess(c, id);
    const result = await this.tenants.removeFromHousehold(id, tenantId);
    return c.json(result, 200);
  };

  previewRemoveTenant = async (c: Context) => {
    const { id, tenantId } = parseOrThrow(householdTenantParamsSchema, c.req.param());
    assertHouseholdAccess(c, id);
    const preview = await this.tenants.getRemovalPreview(id, tenantId);
    return c.json(preview, 200);
  };
}

export const householdController = new HouseholdController();
