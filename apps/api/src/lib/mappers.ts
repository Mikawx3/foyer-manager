import type { Category, Expense, ExpenseSplit, Household, Tenant } from "@foyer/types";
import type {
  Category as PrismaCategory,
  Expense as PrismaExpense,
  ExpenseSplit as PrismaExpenseSplit,
  Household as PrismaHousehold,
  Tenant as PrismaTenant,
} from "@prisma/client";
import { decimalToNumber } from "./decimal.js";

export function toHouseholdDto(household: PrismaHousehold): Household {
  return {
    id: household.id,
    name: household.name,
    createdAt: household.createdAt.toISOString(),
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

export function toExpenseDto(expense: PrismaExpense): Expense {
  return {
    id: expense.id,
    amount: decimalToNumber(expense.amount),
    description: expense.description,
    categoryId: expense.categoryId,
    paidByTenantId: expense.paidByTenantId,
    householdId: expense.householdId,
    date: expense.date.toISOString(),
    createdAt: expense.createdAt.toISOString(),
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
