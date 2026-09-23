import type { HouseholdInvite } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { handlePrismaError } from "../lib/prisma-errors.js";

export class HouseholdInviteRepository {
  async create(data: {
    token: string;
    householdId: string;
    createdById: string;
    expiresAt: Date;
  }): Promise<HouseholdInvite> {
    try {
      return await prisma.householdInvite.create({ data });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findByToken(token: string): Promise<HouseholdInvite | null> {
    return prisma.householdInvite.findUnique({ where: { token } });
  }
}

export const householdInviteRepository = new HouseholdInviteRepository();
