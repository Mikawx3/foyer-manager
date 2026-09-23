import type { User } from "@prisma/client";
import { randomUUID } from "node:crypto";
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

  async createAccount(data: {
    email: string;
    passwordHash: string;
  }): Promise<User> {
    try {
      return await prisma.user.create({
        data: {
          email: data.email,
          password: data.passwordHash,
          isGuest: false,
        },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async promoteGuest(id: string, email: string, passwordHash: string): Promise<User> {
    try {
      return await prisma.user.update({
        where: { id },
        data: {
          email,
          password: passwordHash,
          isGuest: false,
        },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async deleteGuestsWithoutMembership(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }
    await prisma.user.deleteMany({
      where: {
        id: { in: ids },
        isGuest: true,
        memberships: { none: {} },
      },
    });
  }

  async deleteExpiredGuests(olderThan: Date): Promise<void> {
    await prisma.user.deleteMany({
      where: {
        isGuest: true,
        createdAt: { lt: olderThan },
      },
    });
  }

  async createGuest(): Promise<User> {
    try {
      return await prisma.user.create({
        data: {
          email: `guest+${randomUUID()}@guests.foyer.invalid`,
          password: null,
          isGuest: true,
        },
      });
    } catch (error) {
      handlePrismaError(error);
    }
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
            isGuest: false,
          },
        });

        await tx.householdMember.create({
          data: {
            userId: user.id,
            householdId: household.id,
            role: "admin",
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
