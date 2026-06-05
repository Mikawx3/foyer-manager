import type { Tenant } from "@foyer/types";
import { ForbiddenError, NotFoundError } from "../errors/app.errors.js";
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
import { expenseService, type ExpenseService } from "./expense.service.js";
import type { CreateNestedTenantInput, CreateTenantInput } from "../validators/tenant.validator.js";

function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency: "EUR",
  }).format(Math.abs(amount));
  const sign = amount < 0 ? "−" : "";
  return `${sign}${formatted}`;
}

export interface RemoveTenantResult {
  tenant: Tenant;
  mode: "hard" | "soft";
  switchedToSolo: boolean;
}

export interface TenantRemovalPreview {
  balance: number;
  hasHistory: boolean;
  wouldSwitchToSolo: boolean;
}

export class TenantService {
  constructor(
    private readonly repository: TenantRepository = tenantRepository,
    private readonly households: HouseholdRepository = householdRepository,
    private readonly expenses: ExpenseService = expenseService,
  ) {}

  async listByHousehold(
    householdId: string,
    options?: { includeArchived?: boolean },
  ): Promise<Tenant[]> {
    const household = await this.households.findById(householdId);
    if (!household) {
      throw new NotFoundError("Household not found");
    }
    const tenants = await this.repository.findAllByHousehold(householdId, options);
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
    await this.maybeSwitchToShared(data.householdId);
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

  async getRemovalPreview(
    householdId: string,
    tenantId: string,
  ): Promise<TenantRemovalPreview> {
    const tenant = await this.repository.findById(tenantId);
    if (!tenant || tenant.householdId !== householdId || !tenant.active) {
      throw new NotFoundError("Tenant not found");
    }

    const balances = await this.expenses.getBalances(householdId, { includeArchived: true });
    const tenantBalance = balances.find((row) => row.tenantId === tenantId);
    const balance = tenantBalance?.balance ?? 0;
    const hasHistory = await this.repository.hasHistory(tenantId);
    const activeCount = await this.repository.countActiveByHousehold(householdId);

    return {
      balance,
      hasHistory,
      wouldSwitchToSolo: activeCount === 2,
    };
  }

  async removeFromHousehold(
    householdId: string,
    tenantId: string,
  ): Promise<RemoveTenantResult> {
    const tenant = await this.repository.findById(tenantId);
    if (!tenant || tenant.householdId !== householdId) {
      throw new NotFoundError("Tenant not found");
    }
    if (!tenant.active) {
      throw new NotFoundError("Tenant not found");
    }

    const preview = await this.getRemovalPreview(householdId, tenantId);

    if (Math.abs(preview.balance) > 0.005) {
      throw new ForbiddenError(
        `${tenant.name} has an outstanding balance of ${formatCurrency(preview.balance)}. Settle up before removing.`,
      );
    }

    let removed: Tenant;
    let mode: "hard" | "soft";

    if (preview.hasHistory) {
      removed = toTenantDto(await this.repository.softDeleteById(tenantId));
      mode = "soft";
    } else {
      removed = toTenantDto(await this.repository.deleteById(tenantId));
      mode = "hard";
    }

    const activeCount = await this.repository.countActiveByHousehold(householdId);
    let switchedToSolo = false;
    if (activeCount === 1) {
      await this.households.updateById(householdId, { type: "solo" });
      switchedToSolo = true;
    }

    return { tenant: removed, mode, switchedToSolo };
  }

  async delete(id: string): Promise<Tenant> {
    const tenant = await this.repository.findById(id);
    if (!tenant) {
      throw new NotFoundError("Tenant not found");
    }
    const result = await this.removeFromHousehold(tenant.householdId, id);
    return result.tenant;
  }

  private async maybeSwitchToShared(householdId: string): Promise<void> {
    const household = await this.households.findById(householdId);
    if (!household || household.type !== "solo") {
      return;
    }
    const activeCount = await this.repository.countActiveByHousehold(householdId);
    if (activeCount >= 2) {
      await this.households.updateById(householdId, { type: "shared" });
    }
  }

  private async assertHouseholdExists(householdId: string): Promise<void> {
    const household = await this.households.findById(householdId);
    if (!household) {
      throw new NotFoundError("Household not found");
    }
  }
}

export const tenantService = new TenantService();
