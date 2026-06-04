import type { Expense, ExpenseSplit } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { handlePrismaError } from "../lib/prisma-errors.js";
import { numberToDecimal } from "../lib/decimal.js";

export type ExpenseWithSplits = Expense & { splits: ExpenseSplit[] };

export class ExpenseRepository {
  async findById(id: string): Promise<Expense | null> {
    return prisma.expense.findUnique({ where: { id } });
  }

  async findAllByHousehold(householdId: string): Promise<Expense[]> {
    return prisma.expense.findMany({
      where: { householdId },
      orderBy: { date: "desc" },
    });
  }

  async findAllByHouseholdWithSplits(
    householdId: string,
  ): Promise<ExpenseWithSplits[]> {
    return prisma.expense.findMany({
      where: { householdId },
      include: { splits: true },
      orderBy: { date: "desc" },
    });
  }

  async create(data: {
    amount: number;
    description: string;
    categoryId: string;
    paidByTenantId: string;
    householdId: string;
    date: Date;
  }): Promise<Expense> {
    try {
      return await prisma.expense.create({
        data: {
          amount: numberToDecimal(data.amount),
          description: data.description,
          categoryId: data.categoryId,
          paidByTenantId: data.paidByTenantId,
          householdId: data.householdId,
          date: data.date,
        },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async deleteById(id: string): Promise<Expense> {
    try {
      return await prisma.expense.delete({ where: { id } });
    } catch (error) {
      handlePrismaError(error);
    }
  }
}

export const expenseRepository = new ExpenseRepository();
