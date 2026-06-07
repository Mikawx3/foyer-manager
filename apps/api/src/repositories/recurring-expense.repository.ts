import type { Prisma, RecurringExpense, RecurringExpenseSplit, Tenant } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { handlePrismaError } from "../lib/prisma-errors.js";
import { numberToDecimal } from "../lib/decimal.js";

export type RecurringExpenseWithRelations = RecurringExpense & {
  paidBy: Tenant;
  splits: (RecurringExpenseSplit & { tenant: Tenant })[];
};

export class RecurringExpenseRepository {
  async findAllByHousehold(householdId: string): Promise<RecurringExpenseWithRelations[]> {
    return prisma.recurringExpense.findMany({
      where: { householdId },
      include: {
        paidBy: true,
        splits: { include: { tenant: true } },
      },
      orderBy: { nextDueDate: "asc" },
    });
  }

  async findDueByHousehold(
    householdId: string,
    asOf: Date,
  ): Promise<RecurringExpenseWithRelations[]> {
    return prisma.recurringExpense.findMany({
      where: {
        householdId,
        active: true,
        nextDueDate: { lte: asOf },
      },
      include: {
        paidBy: true,
        splits: { include: { tenant: true } },
      },
      orderBy: { nextDueDate: "asc" },
    });
  }

  async findById(id: string): Promise<RecurringExpenseWithRelations | null> {
    return prisma.recurringExpense.findUnique({
      where: { id },
      include: {
        paidBy: true,
        splits: { include: { tenant: true } },
      },
    });
  }

  async create(data: {
    householdId: string;
    title: string;
    amount: number;
    category?: string;
    paidById: string;
    frequency: string;
    startDate: Date;
    nextDueDate: Date;
    splits?: { tenantId: string; percentage: number }[];
  }): Promise<RecurringExpenseWithRelations> {
    try {
      const hasSplits = data.splits !== undefined && data.splits.length > 0;
      return await prisma.recurringExpense.create({
        data: {
          householdId: data.householdId,
          title: data.title,
          amount: numberToDecimal(data.amount),
          category: data.category,
          paidById: data.paidById,
          frequency: data.frequency,
          startDate: data.startDate,
          nextDueDate: data.nextDueDate,
          ...(hasSplits && {
            splits: {
              create: data.splits.map((split) => ({
                tenantId: split.tenantId,
                percentage: split.percentage,
              })),
            },
          }),
        },
        include: {
          paidBy: true,
          splits: { include: { tenant: true } },
        },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async update(
    id: string,
    data: Prisma.RecurringExpenseUpdateInput,
    splits?: { tenantId: string; percentage: number }[],
  ): Promise<RecurringExpenseWithRelations> {
    try {
      return await prisma.$transaction(async (tx) => {
        if (splits !== undefined) {
          await tx.recurringExpenseSplit.deleteMany({ where: { recurringExpenseId: id } });
          await tx.recurringExpenseSplit.createMany({
            data: splits.map((split) => ({
              recurringExpenseId: id,
              tenantId: split.tenantId,
              percentage: split.percentage,
            })),
          });
        }

        const updateData: Prisma.RecurringExpenseUpdateInput = { ...data };
        if (typeof updateData.amount === "number") {
          updateData.amount = numberToDecimal(updateData.amount);
        }

        return tx.recurringExpense.update({
          where: { id },
          data: updateData,
          include: {
            paidBy: true,
            splits: { include: { tenant: true } },
          },
        });
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async updateNextDueDate(id: string, nextDueDate: Date): Promise<void> {
    await prisma.recurringExpense.update({
      where: { id },
      data: { nextDueDate },
    });
  }

  async deleteById(id: string): Promise<RecurringExpense> {
    try {
      return await prisma.recurringExpense.delete({ where: { id } });
    } catch (error) {
      handlePrismaError(error);
    }
  }
}

export const recurringExpenseRepository = new RecurringExpenseRepository();
