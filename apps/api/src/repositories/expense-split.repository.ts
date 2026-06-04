import type { ExpenseSplit } from "@prisma/client";
import { numberToDecimal } from "../lib/decimal.js";
import { prisma } from "../lib/prisma.js";
import { handlePrismaError } from "../lib/prisma-errors.js";

export interface ReplaceSplitInput {
  tenantId: string;
  amount: number;
  percentage: number;
}

export class ExpenseSplitRepository {
  async findByExpenseId(expenseId: string): Promise<ExpenseSplit[]> {
    return prisma.expenseSplit.findMany({
      where: { expenseId },
      orderBy: { tenantId: "asc" },
    });
  }

  async replaceForExpense(
    expenseId: string,
    splits: ReplaceSplitInput[],
  ): Promise<ExpenseSplit[]> {
    try {
      return await prisma.$transaction(async (tx) => {
        await tx.expenseSplit.deleteMany({ where: { expenseId } });

        if (splits.length === 0) {
          return [];
        }

        await tx.expenseSplit.createMany({
          data: splits.map((split) => ({
            expenseId,
            tenantId: split.tenantId,
            amount: numberToDecimal(split.amount),
            percentage: split.percentage,
          })),
        });

        return tx.expenseSplit.findMany({
          where: { expenseId },
          orderBy: { tenantId: "asc" },
        });
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }
}

export const expenseSplitRepository = new ExpenseSplitRepository();
