import type { Household } from "@foyer/types";
import { NotFoundError } from "../errors/app.errors.js";
import { generateMemberEmail } from "../lib/member-email.js";
import { toHouseholdDto } from "../lib/mappers.js";
import { DEFAULT_TENANT_COLOR } from "../lib/tenant-colors.js";
import {
  householdRepository,
  type HouseholdRepository,
} from "../repositories/household.repository.js";
import type {
  CreateHouseholdInput,
  UpdateHouseholdInput,
} from "../validators/household.validator.js";

export class HouseholdService {
  constructor(private readonly repository: HouseholdRepository = householdRepository) {}

  async list(): Promise<Household[]> {
    const households = await this.repository.findAll();
    return households.map(toHouseholdDto);
  }

  async getById(id: string): Promise<Household> {
    const household = await this.repository.findById(id);
    if (!household) {
      throw new NotFoundError("Household not found");
    }
    return toHouseholdDto(household);
  }

  async create(input: CreateHouseholdInput): Promise<Household> {
    if (input.type === "solo") {
      const household = await this.repository.createWithSoloTenant({
        name: input.name,
        type: input.type,
        settlementPeriod: input.settlementPeriod,
        tenantName: "Me",
        tenantEmail: generateMemberEmail(),
        tenantColor: DEFAULT_TENANT_COLOR,
      });
      return toHouseholdDto(household);
    }

    const household = await this.repository.create({
      name: input.name,
      type: input.type,
      settlementPeriod: input.settlementPeriod,
    });
    return toHouseholdDto(household);
  }

  async update(id: string, input: UpdateHouseholdInput): Promise<Household> {
    await this.getById(id);
    const household = await this.repository.updateById(id, {
      settlementPeriod: input.settlementPeriod,
    });
    return toHouseholdDto(household);
  }

  async delete(id: string): Promise<Household> {
    const household = await this.repository.deleteById(id);
    return toHouseholdDto(household);
  }
}

export const householdService = new HouseholdService();
