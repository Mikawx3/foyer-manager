import type { Expense, ExpenseSplit, Prisma } from "@prisma/client";
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

  async countByWhere(where: Prisma.ExpenseWhereInput): Promise<number> {
    return prisma.expense.count({ where });
  }

  async findPageByWhere(
    where: Prisma.ExpenseWhereInput,
    options: { skip: number; take: number },
  ): Promise<Expense[]> {
    return prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
      skip: options.skip,
      take: options.take,
    });
  }

  async findAllByHouseholdWithSplits(
    householdId: string,
    options?: { dateFrom?: Date },
  ): Promise<ExpenseWithSplits[]> {
    return prisma.expense.findMany({
      where: {
        householdId,
        ...(options?.dateFrom !== undefined && {
          date: { gte: options.dateFrom },
        }),
      },
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
    splitMode?: "default" | "custom";
    recurringExpenseId?: string;
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
          splitMode: data.splitMode ?? "default",
          ...(data.recurringExpenseId !== undefined && {
            recurringExpenseId: data.recurringExpenseId,
          }),
        },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async countByRecurringExpenseId(recurringExpenseId: string): Promise<number> {
    return prisma.expense.count({ where: { recurringExpenseId } });
  }

  async countByRecurringExpenseIds(
    recurringExpenseIds: string[],
  ): Promise<Map<string, number>> {
    if (recurringExpenseIds.length === 0) {
      return new Map();
    }

    const groups = await prisma.expense.groupBy({
      by: ["recurringExpenseId"],
      where: { recurringExpenseId: { in: recurringExpenseIds } },
      _count: { _all: true },
    });

    const counts = new Map<string, number>();
    for (const group of groups) {
      if (group.recurringExpenseId !== null) {
        counts.set(group.recurringExpenseId, group._count._all);
      }
    }
    return counts;
  }

  async deleteByRecurringExpenseId(recurringExpenseId: string): Promise<void> {
    await prisma.expense.deleteMany({ where: { recurringExpenseId } });
  }

  async updateSplitMode(id: string, splitMode: "default" | "custom"): Promise<Expense> {
    try {
      return await prisma.expense.update({
        where: { id },
        data: { splitMode },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async updateById(
    id: string,
    data: {
      amount: number;
      description: string;
      categoryId: string;
      paidByTenantId: string;
      date: Date;
      splitMode?: "default" | "custom";
    },
  ): Promise<Expense> {
    try {
      return await prisma.expense.update({
        where: { id },
        data: {
          amount: numberToDecimal(data.amount),
          description: data.description,
          categoryId: data.categoryId,
          paidByTenantId: data.paidByTenantId,
          date: data.date,
          ...(data.splitMode !== undefined && { splitMode: data.splitMode }),
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
