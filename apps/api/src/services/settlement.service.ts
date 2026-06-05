import type { Settlement } from "@foyer/types";
import { NotFoundError, ValidationError } from "../errors/app.errors.js";
import { toSettlementDto } from "../lib/mappers.js";
import {
  householdRepository,
  type HouseholdRepository,
} from "../repositories/household.repository.js";
import {
  settlementRepository,
  type SettlementRepository,
} from "../repositories/settlement.repository.js";
import {
  tenantRepository,
  type TenantRepository,
} from "../repositories/tenant.repository.js";
import type { CreateSettlementInput } from "../validators/settlement.validator.js";

const UNDO_WINDOW_MS = 24 * 60 * 60 * 1000;

export class SettlementService {
  constructor(
    private readonly settlements: SettlementRepository = settlementRepository,
    private readonly households: HouseholdRepository = householdRepository,
    private readonly tenants: TenantRepository = tenantRepository,
  ) {}

  async listByHousehold(householdId: string): Promise<Settlement[]> {
    await this.assertHouseholdExists(householdId);
    const items = await this.settlements.findAllByHousehold(householdId);
    return items.map(toSettlementDto);
  }

  async create(householdId: string, input: CreateSettlementInput): Promise<Settlement> {
    await this.assertHouseholdExists(householdId);
    await this.assertTenantInHousehold(input.fromTenantId, householdId);
    await this.assertTenantInHousehold(input.toTenantId, householdId);

    const date = input.date !== undefined ? new Date(input.date) : new Date();

    const created = await this.settlements.create({
      householdId,
      fromTenantId: input.fromTenantId,
      toTenantId: input.toTenantId,
      amount: input.amount,
      note: input.note,
      date,
    });

    return toSettlementDto(created);
  }

  async delete(householdId: string, settlementId: string): Promise<Settlement> {
    await this.assertHouseholdExists(householdId);

    const settlement = await this.settlements.findById(settlementId);
    if (!settlement || settlement.householdId !== householdId) {
      throw new NotFoundError("Settlement not found");
    }

    const ageMs = Date.now() - settlement.createdAt.getTime();
    if (ageMs > UNDO_WINDOW_MS) {
      throw new ValidationError("Settlements can only be undone within 24 hours");
    }

    const deleted = await this.settlements.deleteById(settlementId);
    return toSettlementDto(deleted);
  }

  private async assertHouseholdExists(householdId: string): Promise<void> {
    const household = await this.households.findById(householdId);
    if (!household) {
      throw new NotFoundError("Household not found");
    }
  }

  private async assertTenantInHousehold(
    tenantId: string,
    householdId: string,
  ): Promise<void> {
    const tenant = await this.tenants.findById(tenantId);
    if (!tenant || tenant.householdId !== householdId) {
      throw new ValidationError("Tenant does not belong to this household", {
        tenantId,
      });
    }
  }
}

export const settlementService = new SettlementService();
