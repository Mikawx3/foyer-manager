import type { Household } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { handlePrismaError } from "../lib/prisma-errors.js";

export class HouseholdRepository {
  async findById(id: string): Promise<Household | null> {
    return prisma.household.findUnique({ where: { id } });
  }

  async findAll(): Promise<Household[]> {
    return prisma.household.findMany({ orderBy: { createdAt: "desc" } });
  }

  async create(data: { name: string }): Promise<Household> {
    return prisma.household.create({ data });
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
