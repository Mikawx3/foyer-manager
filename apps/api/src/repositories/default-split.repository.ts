import type { DefaultSplit, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { handlePrismaError } from "../lib/prisma-errors.js";

export interface ReplaceDefaultSplitInput {
  tenantId: string;
  percentage: number;
}

export class DefaultSplitRepository {
  async findAllByHousehold(householdId: string): Promise<DefaultSplit[]> {
    return prisma.defaultSplit.findMany({
      where: { householdId },
      orderBy: [{ categoryId: "asc" }, { tenantId: "asc" }],
    });
  }

  async replaceForScope(
    householdId: string,
    categoryId: string | null,
    rows: ReplaceDefaultSplitInput[],
  ): Promise<DefaultSplit[]> {
    const categoryFilter: Prisma.DefaultSplitWhereInput =
      categoryId === null ? { categoryId: null } : { categoryId };

    try {
      return await prisma.$transaction(async (tx) => {
        await tx.defaultSplit.deleteMany({
          where: { householdId, ...categoryFilter },
        });

        if (rows.length === 0) {
          return [];
        }

        await tx.defaultSplit.createMany({
          data: rows.map((row) => ({
            householdId,
            categoryId,
            tenantId: row.tenantId,
            percentage: row.percentage,
          })),
        });

        return tx.defaultSplit.findMany({
          where: { householdId, ...categoryFilter },
          orderBy: { tenantId: "asc" },
        });
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async deleteByCategory(householdId: string, categoryId: string): Promise<void> {
    try {
      await prisma.defaultSplit.deleteMany({
        where: { householdId, categoryId },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findByHouseholdAndCategory(
    householdId: string,
    categoryId: string | null,
  ): Promise<DefaultSplit[]> {
    return prisma.defaultSplit.findMany({
      where: {
        householdId,
        categoryId,
      },
      orderBy: { tenantId: "asc" },
    });
  }
}

export const defaultSplitRepository = new DefaultSplitRepository();
