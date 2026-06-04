import type { Household } from "@foyer/types";
import { NotFoundError } from "../errors/app.errors.js";
import { toHouseholdDto } from "../lib/mappers.js";
import {
  householdRepository,
  type HouseholdRepository,
} from "../repositories/household.repository.js";

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

  async create(data: { name: string }): Promise<Household> {
    const household = await this.repository.create(data);
    return toHouseholdDto(household);
  }

  async delete(id: string): Promise<Household> {
    const household = await this.repository.deleteById(id);
    return toHouseholdDto(household);
  }
}

export const householdService = new HouseholdService();
