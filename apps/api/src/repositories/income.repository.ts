import type { Income } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { handlePrismaError } from "../lib/prisma-errors.js";
import { numberToDecimal } from "../lib/decimal.js";

export class IncomeRepository {
  async findByHouseholdAndMonth(householdId: string, month: string): Promise<Income[]> {
    return prisma.income.findMany({
      where: { householdId, month },
      orderBy: { createdAt: "desc" },
    });
  }

  async findByHousehold(householdId: string, months: string[]): Promise<Income[]> {
    return prisma.income.findMany({
      where: {
        householdId,
        month: { in: months },
      },
      orderBy: [{ month: "asc" }, { createdAt: "desc" }],
    });
  }

  async findById(id: string): Promise<Income | null> {
    return prisma.income.findUnique({ where: { id } });
  }

  async create(data: {
    householdId: string;
    tenantId: string;
    amount: number;
    label: string;
    month: string;
    note?: string;
  }): Promise<Income> {
    try {
      return await prisma.income.create({
        data: {
          householdId: data.householdId,
          tenantId: data.tenantId,
          amount: numberToDecimal(data.amount),
          label: data.label,
          month: data.month,
          note: data.note,
        },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async update(
    id: string,
    data: {
      amount?: number;
      label?: string;
      note?: string | null;
    },
  ): Promise<Income> {
    try {
      return await prisma.income.update({
        where: { id },
        data: {
          ...(data.amount !== undefined && { amount: numberToDecimal(data.amount) }),
          ...(data.label !== undefined && { label: data.label }),
          ...(data.note !== undefined && { note: data.note }),
        },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async delete(id: string): Promise<Income> {
    try {
      return await prisma.income.delete({ where: { id } });
    } catch (error) {
      handlePrismaError(error);
    }
  }
}

export const incomeRepository = new IncomeRepository();
