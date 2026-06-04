import type { Category } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { handlePrismaError } from "../lib/prisma-errors.js";

export class CategoryRepository {
  async findById(id: string): Promise<Category | null> {
    return prisma.category.findUnique({ where: { id } });
  }

  async findAllByHousehold(householdId: string): Promise<Category[]> {
    return prisma.category.findMany({
      where: { householdId },
      orderBy: { name: "asc" },
    });
  }

  async create(data: { name: string; householdId: string }): Promise<Category> {
    try {
      return await prisma.category.create({ data });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async countExpenses(categoryId: string): Promise<number> {
    return prisma.expense.count({ where: { categoryId } });
  }

  async deleteById(id: string): Promise<Category> {
    try {
      return await prisma.category.delete({ where: { id } });
    } catch (error) {
      handlePrismaError(error);
    }
  }
}

export const categoryRepository = new CategoryRepository();
