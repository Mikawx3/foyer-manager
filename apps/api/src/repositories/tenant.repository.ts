import type { Tenant } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { handlePrismaError } from "../lib/prisma-errors.js";

export class TenantRepository {
  async findById(id: string): Promise<Tenant | null> {
    return prisma.tenant.findUnique({ where: { id } });
  }

  async findAllByHousehold(householdId: string): Promise<Tenant[]> {
    return prisma.tenant.findMany({
      where: { householdId },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(data: {
    name: string;
    email: string;
    color?: string;
    householdId: string;
  }): Promise<Tenant> {
    try {
      return await prisma.tenant.create({ data });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async deleteById(id: string): Promise<Tenant> {
    try {
      return await prisma.tenant.delete({ where: { id } });
    } catch (error) {
      handlePrismaError(error);
    }
  }
}

export const tenantRepository = new TenantRepository();
