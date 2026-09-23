import type { User } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { handlePrismaError } from "../lib/prisma-errors.js";
import { DEFAULT_CATEGORIES } from "../lib/default-categories.js";
import { categoryRepository } from "./category.repository.js";

export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });
  }

  async findByGoogleSub(googleSub: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { googleSub } });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async linkGoogleSub(id: string, googleSub: string): Promise<User> {
    try {
      return await prisma.user.update({
        where: { id },
        data: { googleSub },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async createWithHousehold(data: {
    email: string;
    passwordHash: string | null;
    googleSub?: string | null;
    householdName: string;
  }): Promise<{ user: User; householdId: string }> {
    try {
      return await prisma.$transaction(async (tx) => {
        const household = await tx.household.create({
          data: {
            name: data.householdName,
            type: "shared",
            settlementPeriod: "monthly",
          },
        });

        await categoryRepository.createManyForHousehold(
          household.id,
          DEFAULT_CATEGORIES,
          tx,
        );

        const user = await tx.user.create({
          data: {
            email: data.email,
            password: data.passwordHash,
            googleSub: data.googleSub ?? null,
            householdId: household.id,
          },
        });

        return { user, householdId: household.id };
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }
}

export const userRepository = new UserRepository();
