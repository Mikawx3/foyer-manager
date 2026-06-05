import type { Household, HouseholdDeletionPreview } from "@foyer/types";
import { NotFoundError } from "../errors/app.errors.js";
import { generateMemberEmail } from "../lib/member-email.js";
import { round2 } from "../lib/decimal.js";
import { toHouseholdDto } from "../lib/mappers.js";
import { DEFAULT_TENANT_COLOR } from "../lib/tenant-colors.js";
import {
  expenseRepository,
  type ExpenseRepository,
} from "../repositories/expense.repository.js";
import {
  householdRepository,
  type HouseholdRepository,
} from "../repositories/household.repository.js";
import {
  recurringExpenseRepository,
  type RecurringExpenseRepository,
} from "../repositories/recurring-expense.repository.js";
import {
  tenantRepository,
  type TenantRepository,
} from "../repositories/tenant.repository.js";
import { expenseService, type ExpenseService } from "./expense.service.js";
import type {
  CreateHouseholdInput,
  UpdateHouseholdInput,
} from "../validators/household.validator.js";

const BALANCE_EPSILON = 0.01;

function computeOutstandingBalanceStats(
  balances: { balance: number }[],
): Pick<HouseholdDeletionPreview, "membersWithUnresolvedBalance" | "outstandingBalanceTotal"> {
  const unresolved = balances.filter((row) => Math.abs(row.balance) > BALANCE_EPSILON);
  const outstandingBalanceTotal = round2(
    unresolved.reduce((sum, row) => sum + Math.abs(row.balance), 0),
  );
  return {
    membersWithUnresolvedBalance: unresolved.length,
    outstandingBalanceTotal,
  };
}

export class HouseholdService {
  constructor(
    private readonly repository: HouseholdRepository = householdRepository,
    private readonly tenants: TenantRepository = tenantRepository,
    private readonly expenses: ExpenseRepository = expenseRepository,
    private readonly recurring: RecurringExpenseRepository = recurringExpenseRepository,
    private readonly expenseBalances: ExpenseService = expenseService,
  ) {}

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

  async getDeletionPreview(householdId: string): Promise<HouseholdDeletionPreview> {
    await this.getById(householdId);

    const [tenantRecords, expenseCount, expenseTotal, recurringExpenses, balances] =
      await Promise.all([
        this.tenants.findAllByHousehold(householdId),
        this.expenses.countByWhere({ householdId }),
        this.expenses.sumAmountByHousehold(householdId),
        this.recurring.findAllByHousehold(householdId),
        this.expenseBalances.getBalances(householdId),
      ]);

    const memberCount = tenantRecords.filter((tenant) => tenant.active).length;
    const balanceStats = computeOutstandingBalanceStats(balances);

    return {
      memberCount,
      expenseCount,
      expenseTotal: round2(expenseTotal),
      recurringExpenseCount: recurringExpenses.length,
      ...balanceStats,
    };
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
      ...(input.settlementPeriod !== undefined && {
        settlementPeriod: input.settlementPeriod,
      }),
      ...(input.type !== undefined && { type: input.type }),
    });
    return toHouseholdDto(household);
  }

  async delete(id: string): Promise<Household> {
    const household = await this.repository.deleteById(id);
    return toHouseholdDto(household);
  }
}

export const householdService = new HouseholdService();
