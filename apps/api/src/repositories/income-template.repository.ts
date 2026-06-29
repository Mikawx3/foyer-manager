import type { IncomeTemplate } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { handlePrismaError } from "../lib/prisma-errors.js";
import { numberToDecimal } from "../lib/decimal.js";

export class IncomeTemplateRepository {
  async findAllByHousehold(householdId: string): Promise<IncomeTemplate[]> {
    return prisma.incomeTemplate.findMany({
      where: { householdId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findActiveByHousehold(householdId: string): Promise<IncomeTemplate[]> {
    return prisma.incomeTemplate.findMany({
      where: { householdId, active: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string): Promise<IncomeTemplate | null> {
    return prisma.incomeTemplate.findUnique({ where: { id } });
  }

  async create(data: {
    householdId: string;
    tenantId: string;
    amount: number;
    label: string;
    note?: string;
  }): Promise<IncomeTemplate> {
    try {
      return await prisma.incomeTemplate.create({
        data: {
          householdId: data.householdId,
          tenantId: data.tenantId,
          amount: numberToDecimal(data.amount),
          label: data.label,
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
      active?: boolean;
    },
  ): Promise<IncomeTemplate> {
    try {
      return await prisma.incomeTemplate.update({
        where: { id },
        data: {
          ...(data.amount !== undefined && { amount: numberToDecimal(data.amount) }),
          ...(data.label !== undefined && { label: data.label }),
          ...(data.note !== undefined && { note: data.note }),
          ...(data.active !== undefined && { active: data.active }),
        },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async delete(id: string): Promise<IncomeTemplate> {
    try {
      return await prisma.incomeTemplate.delete({ where: { id } });
    } catch (error) {
      handlePrismaError(error);
    }
  }
}

export const incomeTemplateRepository = new IncomeTemplateRepository();
