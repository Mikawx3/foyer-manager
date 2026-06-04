import type { Tenant } from "@foyer/types";
import { NotFoundError } from "../errors/app.errors.js";
import { toTenantDto } from "../lib/mappers.js";
import {
  householdRepository,
  type HouseholdRepository,
} from "../repositories/household.repository.js";
import {
  tenantRepository,
  type TenantRepository,
} from "../repositories/tenant.repository.js";

export class TenantService {
  constructor(
    private readonly repository: TenantRepository = tenantRepository,
    private readonly households: HouseholdRepository = householdRepository,
  ) {}

  async listByHousehold(householdId: string): Promise<Tenant[]> {
    const household = await this.households.findById(householdId);
    if (!household) {
      throw new NotFoundError("Household not found");
    }
    const tenants = await this.repository.findAllByHousehold(householdId);
    return tenants.map(toTenantDto);
  }

  async getById(id: string): Promise<Tenant> {
    const tenant = await this.repository.findById(id);
    if (!tenant) {
      throw new NotFoundError("Tenant not found");
    }
    return toTenantDto(tenant);
  }

  async create(data: {
    name: string;
    email: string;
    householdId: string;
  }): Promise<Tenant> {
    const tenant = await this.repository.create(data);
    return toTenantDto(tenant);
  }

  async delete(id: string): Promise<Tenant> {
    const tenant = await this.repository.deleteById(id);
    return toTenantDto(tenant);
  }
}

export const tenantService = new TenantService();
