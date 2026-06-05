import type { Tenant } from "@foyer/types";
import { NotFoundError } from "../errors/app.errors.js";
import { generateMemberEmail } from "../lib/member-email.js";
import { toTenantDto } from "../lib/mappers.js";
import {
  householdRepository,
  type HouseholdRepository,
} from "../repositories/household.repository.js";
import {
  tenantRepository,
  type TenantRepository,
} from "../repositories/tenant.repository.js";
import type { CreateNestedTenantInput, CreateTenantInput } from "../validators/tenant.validator.js";

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

  async create(data: CreateTenantInput): Promise<Tenant> {
    await this.assertHouseholdExists(data.householdId);
    const tenant = await this.repository.create({
      name: data.name,
      email: data.email ?? generateMemberEmail(),
      color: data.color,
      householdId: data.householdId,
    });
    return toTenantDto(tenant);
  }

  async createForHousehold(
    householdId: string,
    data: CreateNestedTenantInput,
  ): Promise<Tenant> {
    return this.create({
      ...data,
      householdId,
    });
  }

  async delete(id: string): Promise<Tenant> {
    const tenant = await this.repository.deleteById(id);
    return toTenantDto(tenant);
  }

  private async assertHouseholdExists(householdId: string): Promise<void> {
    const household = await this.households.findById(householdId);
    if (!household) {
      throw new NotFoundError("Household not found");
    }
  }
}

export const tenantService = new TenantService();
