import type {
  Category,
  DefaultSplit,
  Expense,
  ExpenseSplit,
  Household,
  HouseholdType,
  Income,
  IncomeTemplate,
  Settlement,
  SettlementPeriod,
  SplitMode,
  Tenant,
} from "@foyer/types";
import { isCategoryColorKey } from "./category-colors.js";
import type {
  Category as PrismaCategory,
  DefaultSplit as PrismaDefaultSplit,
  Expense as PrismaExpense,
  ExpenseSplit as PrismaExpenseSplit,
  Household as PrismaHousehold,
  Income as PrismaIncome,
  IncomeTemplate as PrismaIncomeTemplate,
  Settlement as PrismaSettlement,
  Tenant as PrismaTenant,
} from "@prisma/client";
import { decimalToNumber } from "./decimal.js";

function toSettlementPeriod(value: string): SettlementPeriod {
  if (value === "monthly" || value === "quarterly" || value === "yearly") {
    return value;
  }
  return "none";
}

function toHouseholdType(value: string): HouseholdType {
  return value === "solo" ? "solo" : "shared";
}

export function toHouseholdDto(household: PrismaHousehold): Household {
  return {
    id: household.id,
    name: household.name,
    type: toHouseholdType(household.type),
    settlementPeriod: toSettlementPeriod(household.settlementPeriod),
    createdAt: household.createdAt.toISOString(),
  };
}

export function toSettlementDto(settlement: PrismaSettlement): Settlement {
  return {
    id: settlement.id,
    householdId: settlement.householdId,
    fromTenantId: settlement.fromTenantId,
    toTenantId: settlement.toTenantId,
    amount: decimalToNumber(settlement.amount),
    note: settlement.note,
    date: settlement.date.toISOString(),
    createdAt: settlement.createdAt.toISOString(),
  };
}

export function toCategoryDto(category: PrismaCategory): Category {
  return {
    id: category.id,
    name: category.name,
    ...(category.slug !== null && { slug: category.slug }),
    color: isCategoryColorKey(category.color) ? category.color : "other",
    householdId: category.householdId,
  };
}

export function toTenantDto(tenant: PrismaTenant): Tenant {
  return {
    id: tenant.id,
    name: tenant.name,
    email: tenant.email,
    ...(tenant.color !== null && { color: tenant.color }),
    active: tenant.active,
    ...(tenant.archivedAt != null && {
      archivedAt: tenant.archivedAt.toISOString(),
    }),
    householdId: tenant.householdId,
    createdAt: tenant.createdAt.toISOString(),
  };
}

function toSplitMode(value: string): SplitMode {
  return value === "custom" ? "custom" : "default";
}

export function toExpenseDto(expense: PrismaExpense): Expense {
  return {
    id: expense.id,
    amount: decimalToNumber(expense.amount),
    description: expense.description,
    categoryId: expense.categoryId,
    paidByTenantId: expense.paidByTenantId,
    householdId: expense.householdId,
    ...(expense.recurringExpenseId !== null && {
      recurringExpenseId: expense.recurringExpenseId,
    }),
    splitMode: toSplitMode(expense.splitMode),
    date: expense.date.toISOString(),
    createdAt: expense.createdAt.toISOString(),
  };
}

export function toDefaultSplitDto(split: PrismaDefaultSplit): DefaultSplit {
  return {
    id: split.id,
    householdId: split.householdId,
    categoryId: split.categoryId,
    tenantId: split.tenantId,
    percentage: split.percentage,
    createdAt: split.createdAt.toISOString(),
    updatedAt: split.updatedAt.toISOString(),
  };
}

export function toExpenseSplitDto(split: PrismaExpenseSplit): ExpenseSplit {
  return {
    id: split.id,
    expenseId: split.expenseId,
    tenantId: split.tenantId,
    amount: decimalToNumber(split.amount),
    ...(split.percentage !== null && { percentage: split.percentage }),
  };
}

export function toIncomeDto(income: PrismaIncome): Income {
  return {
    id: income.id,
    householdId: income.householdId,
    tenantId: income.tenantId,
    amount: decimalToNumber(income.amount),
    label: income.label,
    month: income.month,
    ...(income.note !== null && { note: income.note }),
    createdAt: income.createdAt.toISOString(),
    updatedAt: income.updatedAt.toISOString(),
  };
}

export function toIncomeTemplateDto(template: PrismaIncomeTemplate): IncomeTemplate {
  return {
    id: template.id,
    householdId: template.householdId,
    tenantId: template.tenantId,
    amount: decimalToNumber(template.amount),
    label: template.label,
    ...(template.note !== null && { note: template.note }),
    active: template.active,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
}
