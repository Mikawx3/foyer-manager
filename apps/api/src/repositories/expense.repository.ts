import type { Expense, ExpenseSplit, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { handlePrismaError } from "../lib/prisma-errors.js";
import { numberToDecimal, decimalToNumber } from "../lib/decimal.js";
import { monthToDateRange } from "./expense-list-filters.js";

export type ExpenseWithSplits = Expense & { splits: ExpenseSplit[] };

export interface ExpenseWithSplitsOptions {
  dateFrom?: Date;
  month?: string;
}

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

  async sumAmountByWhere(where: Prisma.ExpenseWhereInput): Promise<number> {
    const result = await prisma.expense.aggregate({
      where,
      _sum: { amount: true },
    });
    if (result._sum.amount === null) {
      return 0;
    }
    return decimalToNumber(result._sum.amount);
  }

  async sumAmountByHousehold(householdId: string): Promise<number> {
    const result = await prisma.expense.aggregate({
      where: { householdId },
      _sum: { amount: true },
    });
    if (result._sum.amount === null) {
      return 0;
    }
    return decimalToNumber(result._sum.amount);
  }

  async groupByCategoryForWhere(
    where: Prisma.ExpenseWhereInput,
  ): Promise<{ categoryId: string; amount: number; expenseCount: number }[]> {
    const groups = await prisma.expense.groupBy({
      by: ["categoryId"],
      where,
      _sum: { amount: true },
      _count: { _all: true },
    });

    return groups.map((group) => ({
      categoryId: group.categoryId,
      amount: group._sum.amount !== null ? decimalToNumber(group._sum.amount) : 0,
      expenseCount: group._count._all,
    }));
  }

  async findLargestExpenseByWhere(
    where: Prisma.ExpenseWhereInput,
  ): Promise<{ description: string; amount: number } | null> {
    const expense = await prisma.expense.findFirst({
      where,
      orderBy: [{ amount: "desc" }, { date: "desc" }],
      select: { description: true, amount: true },
    });
    if (!expense) {
      return null;
    }
    return {
      description: expense.description,
      amount: decimalToNumber(expense.amount),
    };
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
    options?: ExpenseWithSplitsOptions,
  ): Promise<ExpenseWithSplits[]> {
    let dateFilter: { gte?: Date; lt?: Date } | undefined;
    if (options?.month !== undefined) {
      const { gte, lt } = monthToDateRange(options.month);
      dateFilter = { gte, lt };
    } else if (options?.dateFrom !== undefined) {
      dateFilter = { gte: options.dateFrom };
    }

    return prisma.expense.findMany({
      where: {
        householdId,
        ...(dateFilter !== undefined && { date: dateFilter }),
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

  async findByRecurringExpenseAndDate(
    recurringExpenseId: string,
    date: Date,
  ): Promise<Expense | null> {
    return prisma.expense.findFirst({
      where: {
        recurringExpenseId,
        date,
      },
    });
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
