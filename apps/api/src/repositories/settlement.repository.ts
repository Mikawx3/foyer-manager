import type { Settlement } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { handlePrismaError } from "../lib/prisma-errors.js";
import { numberToDecimal } from "../lib/decimal.js";

export interface SettlementListOptions {
  dateFrom?: Date;
}

export class SettlementRepository {
  async findAllByHousehold(
    householdId: string,
    options?: SettlementListOptions,
  ): Promise<Settlement[]> {
    return prisma.settlement.findMany({
      where: {
        householdId,
        ...(options?.dateFrom !== undefined && {
          date: { gte: options.dateFrom },
        }),
      },
      orderBy: { date: "desc" },
    });
  }

  async findById(id: string): Promise<Settlement | null> {
    return prisma.settlement.findUnique({ where: { id } });
  }

  async create(data: {
    householdId: string;
    fromTenantId: string;
    toTenantId: string;
    amount: number;
    note?: string;
    date: Date;
  }): Promise<Settlement> {
    try {
      return await prisma.settlement.create({
        data: {
          householdId: data.householdId,
          fromTenantId: data.fromTenantId,
          toTenantId: data.toTenantId,
          amount: numberToDecimal(data.amount),
          note: data.note,
          date: data.date,
        },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async deleteById(id: string): Promise<Settlement> {
    try {
      return await prisma.settlement.delete({ where: { id } });
    } catch (error) {
      handlePrismaError(error);
    }
  }
}

export const settlementRepository = new SettlementRepository();
