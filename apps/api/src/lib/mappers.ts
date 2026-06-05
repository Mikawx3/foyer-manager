import type {
  Category,
  DefaultSplit,
  Expense,
  ExpenseSplit,
  Household,
  Settlement,
  SettlementPeriod,
  SplitMode,
  Tenant,
} from "@foyer/types";
import type {
  Category as PrismaCategory,
  DefaultSplit as PrismaDefaultSplit,
  Expense as PrismaExpense,
  ExpenseSplit as PrismaExpenseSplit,
  Household as PrismaHousehold,
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

export function toHouseholdDto(household: PrismaHousehold): Household {
  return {
    id: household.id,
    name: household.name,
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
    householdId: category.householdId,
  };
}

export function toTenantDto(tenant: PrismaTenant): Tenant {
  return {
    id: tenant.id,
    name: tenant.name,
    email: tenant.email,
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
