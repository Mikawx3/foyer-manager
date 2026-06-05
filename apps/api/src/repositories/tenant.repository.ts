import type { Tenant } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { handlePrismaError } from "../lib/prisma-errors.js";

export interface FindTenantsOptions {
  includeArchived?: boolean;
}

export class TenantRepository {
  async findById(id: string): Promise<Tenant | null> {
    return prisma.tenant.findUnique({ where: { id } });
  }

  async findAllByHousehold(
    householdId: string,
    options: FindTenantsOptions = {},
  ): Promise<Tenant[]> {
    const where = options.includeArchived
      ? { householdId }
      : { householdId, active: true };

    return prisma.tenant.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async countActiveByHousehold(householdId: string): Promise<number> {
    return prisma.tenant.count({
      where: { householdId, active: true },
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

  async updateById(
    id: string,
    data: {
      name?: string;
      color?: string;
      active?: boolean;
      archivedAt?: Date | null;
    },
  ): Promise<Tenant> {
    try {
      return await prisma.tenant.update({
        where: { id },
        data,
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async softDeleteById(id: string): Promise<Tenant> {
    try {
      return await prisma.tenant.update({
        where: { id },
        data: { active: false, archivedAt: new Date() },
      });
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

  async hasHistory(tenantId: string): Promise<boolean> {
    const [
      expensesPaid,
      expenseSplits,
      settlementsFrom,
      settlementsTo,
      recurringPaid,
      recurringSplits,
    ] = await Promise.all([
      prisma.expense.count({ where: { paidByTenantId: tenantId } }),
      prisma.expenseSplit.count({ where: { tenantId } }),
      prisma.settlement.count({ where: { fromTenantId: tenantId } }),
      prisma.settlement.count({ where: { toTenantId: tenantId } }),
      prisma.recurringExpense.count({ where: { paidById: tenantId } }),
      prisma.recurringExpenseSplit.count({ where: { tenantId } }),
    ]);

    return (
      expensesPaid +
        expenseSplits +
        settlementsFrom +
        settlementsTo +
        recurringPaid +
        recurringSplits >
      0
    );
  }
}

export const tenantRepository = new TenantRepository();
