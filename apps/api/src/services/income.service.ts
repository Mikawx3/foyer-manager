import type { Income, IncomeStats, IncomeTemplate, ResolvedIncome } from "@foyer/types";
import { NotFoundError, ValidationError } from "../errors/app.errors.js";
import {
  computeSavingsRate,
  last6MonthKeys,
  resolveIncomesForMonth,
  sumResolvedIncomes,
  sumResolvedIncomesByTenant,
  sumResolvedIncomesForMonth,
} from "../lib/income-stats.js";
import { toIncomeDto, toIncomeTemplateDto } from "../lib/mappers.js";
import { buildExpenseListWhere } from "../repositories/expense-list-filters.js";
import {
  expenseRepository,
  type ExpenseRepository,
} from "../repositories/expense.repository.js";
import {
  householdRepository,
  type HouseholdRepository,
} from "../repositories/household.repository.js";
import {
  incomeTemplateRepository,
  type IncomeTemplateRepository,
} from "../repositories/income-template.repository.js";
import {
  incomeRepository,
  type IncomeRepository,
} from "../repositories/income.repository.js";
import {
  tenantRepository,
  type TenantRepository,
} from "../repositories/tenant.repository.js";
import type {
  CreateIncomeInput,
  CreateIncomeTemplateInput,
  UpdateIncomeInput,
  UpdateIncomeTemplateInput,
} from "../validators/income.validator.js";
import { expenseService, type ExpenseService } from "./expense.service.js";

export class IncomeService {
  constructor(
    private readonly incomes: IncomeRepository = incomeRepository,
    private readonly incomeTemplates: IncomeTemplateRepository = incomeTemplateRepository,
    private readonly expenses: ExpenseRepository = expenseRepository,
    private readonly households: HouseholdRepository = householdRepository,
    private readonly tenants: TenantRepository = tenantRepository,
    private readonly expenseSvc: ExpenseService = expenseService,
  ) {}

  async listTemplatesByHousehold(householdId: string): Promise<IncomeTemplate[]> {
    await this.assertHouseholdExists(householdId);
    const items = await this.incomeTemplates.findAllByHousehold(householdId);
    return items.map(toIncomeTemplateDto);
  }

  async createTemplate(
    householdId: string,
    input: CreateIncomeTemplateInput,
  ): Promise<IncomeTemplate> {
    await this.assertHouseholdExists(householdId);
    if (input.householdId !== householdId) {
      throw new ValidationError("householdId in body must match URL household");
    }
    await this.assertTenantInHousehold(input.tenantId, householdId);

    const created = await this.incomeTemplates.create({
      householdId,
      tenantId: input.tenantId,
      amount: input.amount,
      label: input.label,
      ...(input.note !== undefined && { note: input.note }),
    });

    return toIncomeTemplateDto(created);
  }

  async updateTemplate(
    householdId: string,
    templateId: string,
    input: UpdateIncomeTemplateInput,
  ): Promise<IncomeTemplate> {
    await this.assertHouseholdExists(householdId);

    const existing = await this.incomeTemplates.findById(templateId);
    if (!existing || existing.householdId !== householdId) {
      throw new NotFoundError("Income template not found");
    }

    const updated = await this.incomeTemplates.update(templateId, {
      ...(input.amount !== undefined && { amount: input.amount }),
      ...(input.label !== undefined && { label: input.label }),
      ...(input.note !== undefined && { note: input.note }),
      ...(input.active !== undefined && { active: input.active }),
    });

    return toIncomeTemplateDto(updated);
  }

  async deleteTemplate(householdId: string, templateId: string): Promise<IncomeTemplate> {
    await this.assertHouseholdExists(householdId);

    const existing = await this.incomeTemplates.findById(templateId);
    if (!existing || existing.householdId !== householdId) {
      throw new NotFoundError("Income template not found");
    }

    const deleted = await this.incomeTemplates.delete(templateId);
    return toIncomeTemplateDto(deleted);
  }

  async listByHouseholdAndMonth(
    householdId: string,
    month: string,
  ): Promise<ResolvedIncome[]> {
    await this.assertHouseholdExists(householdId);
    const [templates, overrides] = await Promise.all([
      this.incomeTemplates.findAllByHousehold(householdId),
      this.incomes.findByHouseholdAndMonth(householdId, month),
    ]);
    return resolveIncomesForMonth(templates, overrides, month);
  }

  async create(householdId: string, input: CreateIncomeInput): Promise<Income> {
    await this.assertHouseholdExists(householdId);
    if (input.householdId !== householdId) {
      throw new ValidationError("householdId in body must match URL household");
    }
    await this.assertTenantInHousehold(input.tenantId, householdId);

    const created = await this.incomes.create({
      householdId,
      tenantId: input.tenantId,
      amount: input.amount,
      label: input.label,
      month: input.month,
      ...(input.note !== undefined && { note: input.note }),
    });

    return toIncomeDto(created);
  }

  async update(
    householdId: string,
    incomeId: string,
    input: UpdateIncomeInput,
  ): Promise<Income> {
    await this.assertHouseholdExists(householdId);

    const existing = await this.incomes.findById(incomeId);
    if (!existing || existing.householdId !== householdId) {
      throw new NotFoundError("Income not found");
    }

    const updated = await this.incomes.update(incomeId, {
      ...(input.amount !== undefined && { amount: input.amount }),
      ...(input.label !== undefined && { label: input.label }),
      ...(input.note !== undefined && { note: input.note }),
    });

    return toIncomeDto(updated);
  }

  async delete(householdId: string, incomeId: string): Promise<Income> {
    await this.assertHouseholdExists(householdId);

    const existing = await this.incomes.findById(incomeId);
    if (!existing || existing.householdId !== householdId) {
      throw new NotFoundError("Income not found");
    }

    const deleted = await this.incomes.delete(incomeId);
    return toIncomeDto(deleted);
  }

  async getIncomeStats(householdId: string, month: string): Promise<IncomeStats> {
    await this.assertHouseholdExists(householdId);

    const months = last6MonthKeys(month);
    const [templates, overrides, tenants, tenantOwed] = await Promise.all([
      this.incomeTemplates.findAllByHousehold(householdId),
      this.incomes.findByHousehold(householdId, months),
      this.tenants.findAllByHousehold(householdId, { includeArchived: false }),
      this.expenseSvc.getTenantOwedTotalsForMonth(householdId, month),
    ]);

    const resolvedMonth = resolveIncomesForMonth(templates, overrides, month);
    const totalIncome = sumResolvedIncomes(resolvedMonth);
    const totalExpenses = await this.expenses.sumAmountByWhere(
      buildExpenseListWhere({ householdId, month }),
    );
    const remainingBudget = totalIncome - totalExpenses;
    const savingsRate = computeSavingsRate(totalIncome, totalExpenses);

    const tenantIdsWithIncome = new Set(resolvedMonth.map((income) => income.tenantId));
    const relevantTenants = tenants.filter(
      (tenant) => tenant.active || tenantIdsWithIncome.has(tenant.id),
    );

    const byTenant = relevantTenants
      .map((tenant) => {
        const income = sumResolvedIncomesByTenant(resolvedMonth, tenant.id);
        const expenses = tenantOwed.get(tenant.id) ?? 0;
        const balance = income - expenses;
        return {
          tenantId: tenant.id,
          tenantName: tenant.name,
          income,
          expenses,
          balance,
          savingsRate: computeSavingsRate(income, expenses),
        };
      })
      .sort((a, b) => b.balance - a.balance);

    const trend = await Promise.all(
      months.map(async (trendMonth) => {
        const monthIncome = sumResolvedIncomesForMonth(templates, overrides, trendMonth);
        const monthExpenses = await this.expenses.sumAmountByWhere(
          buildExpenseListWhere({ householdId, month: trendMonth }),
        );
        return {
          month: trendMonth,
          income: monthIncome,
          expenses: monthExpenses,
          savings: monthIncome - monthExpenses,
        };
      }),
    );

    return {
      month,
      totalIncome,
      totalExpenses,
      savingsRate,
      remainingBudget,
      byTenant,
      trend,
    };
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

export const incomeService = new IncomeService();
