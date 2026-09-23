import type { HouseholdMember, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export type HouseholdMemberWithUser = Prisma.HouseholdMemberGetPayload<{
  include: { user: true };
}>;
import { handlePrismaError } from "../lib/prisma-errors.js";

export class HouseholdMemberRepository {
  async listByUser(userId: string): Promise<HouseholdMember[]> {
    return prisma.householdMember.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
  }

  async listByHousehold(householdId: string): Promise<HouseholdMemberWithUser[]> {
    return prisma.householdMember.findMany({
      where: { householdId },
      orderBy: { createdAt: "asc" },
      include: { user: true },
    });
  }

  async findByUserAndHousehold(
    userId: string,
    householdId: string,
  ): Promise<HouseholdMember | null> {
    return prisma.householdMember.findUnique({
      where: { userId_householdId: { userId, householdId } },
    });
  }

  async updateRole(id: string, role: string): Promise<HouseholdMember> {
    try {
      return await prisma.householdMember.update({
        where: { id },
        data: { role },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async create(data: {
    userId: string;
    householdId: string;
    role: string;
  }): Promise<HouseholdMember> {
    try {
      return await prisma.householdMember.create({ data });
    } catch (error) {
      handlePrismaError(error);
    }
  }
}

export const householdMemberRepository = new HouseholdMemberRepository();
