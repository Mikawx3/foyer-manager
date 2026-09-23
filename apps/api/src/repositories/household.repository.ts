import type { Household } from "@prisma/client";
import { DEFAULT_CATEGORIES } from "../lib/default-categories.js";
import { prisma } from "../lib/prisma.js";
import { handlePrismaError } from "../lib/prisma-errors.js";
import { categoryRepository } from "./category.repository.js";

export class HouseholdRepository {
  async findById(id: string): Promise<Household | null> {
    return prisma.household.findUnique({ where: { id } });
  }

  async findAll(): Promise<Household[]> {
    return prisma.household.findMany({ orderBy: { createdAt: "desc" } });
  }

  async findByIds(ids: string[]): Promise<Household[]> {
    if (ids.length === 0) {
      return [];
    }
    return prisma.household.findMany({ where: { id: { in: ids } } });
  }

  async create(
    data: {
      name: string;
      type: string;
      settlementPeriod: string;
    },
    ownerUserId?: string,
  ): Promise<Household> {
    return prisma.$transaction(async (tx) => {
      const household = await tx.household.create({ data });
      await categoryRepository.createManyForHousehold(
        household.id,
        DEFAULT_CATEGORIES,
        tx,
      );
      if (ownerUserId) {
        await tx.householdMember.create({
          data: {
            userId: ownerUserId,
            householdId: household.id,
            role: "admin",
          },
        });
      }
      return household;
    });
  }

  async createWithSoloTenant(
    data: {
      name: string;
      type: string;
      settlementPeriod: string;
      tenantName: string;
      tenantEmail: string;
      tenantColor: string;
    },
    ownerUserId?: string,
  ): Promise<Household> {
    return prisma.$transaction(async (tx) => {
      const household = await tx.household.create({
        data: {
          name: data.name,
          type: data.type,
          settlementPeriod: data.settlementPeriod,
        },
      });

      await tx.tenant.create({
        data: {
          name: data.tenantName,
          email: data.tenantEmail,
          color: data.tenantColor,
          householdId: household.id,
          ...(ownerUserId ? { userId: ownerUserId } : {}),
        },
      });

      if (ownerUserId) {
        await tx.householdMember.create({
          data: {
            userId: ownerUserId,
            householdId: household.id,
            role: "admin",
          },
        });
      }

      await categoryRepository.createManyForHousehold(
        household.id,
        DEFAULT_CATEGORIES,
        tx,
      );

      return household;
    });
  }

  async updateById(
    id: string,
    data: { name?: string; settlementPeriod?: string; type?: string },
  ): Promise<Household> {
    try {
      return await prisma.household.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.settlementPeriod !== undefined && {
            settlementPeriod: data.settlementPeriod,
          }),
          ...(data.type !== undefined && { type: data.type }),
        },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async deleteById(id: string): Promise<Household> {
    try {
      return await prisma.household.delete({ where: { id } });
    } catch (error) {
      handlePrismaError(error);
    }
  }
}

export const householdRepository = new HouseholdRepository();
