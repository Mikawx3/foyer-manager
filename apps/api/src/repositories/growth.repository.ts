import type { GrowthTotals } from "@foyer/types";
import { prisma } from "../lib/prisma.js";

export interface GrowthTimestamps {
  accounts: Date[];
  guests: Date[];
  households: Date[];
  invites: Date[];
  expenses: Date[];
}

const pickCreatedAt = { select: { createdAt: true } } as const;

function toDates(rows: { createdAt: Date }[]): Date[] {
  return rows.map((row) => row.createdAt);
}

export class GrowthRepository {
  async countTotals(): Promise<GrowthTotals> {
    const [
      accounts,
      googleAccounts,
      guests,
      households,
      activatedHouseholds,
      sharedHouseholds,
      expenses,
      invites,
    ] = await Promise.all([
      prisma.user.count({ where: { isGuest: false } }),
      prisma.user.count({ where: { isGuest: false, googleSub: { not: null } } }),
      prisma.user.count({ where: { isGuest: true } }),
      prisma.household.count(),
      prisma.household.count({ where: { expenses: { some: {} } } }),
      prisma.householdMember
        .groupBy({ by: ["householdId"], _count: { _all: true } })
        .then((groups) => groups.filter((group) => group._count._all >= 2).length),
      prisma.expense.count(),
      prisma.householdInvite.count(),
    ]);

    return {
      accounts,
      googleAccounts,
      guests,
      households,
      activatedHouseholds,
      sharedHouseholds,
      expenses,
      invites,
    };
  }

  async listCreatedSince(since: Date): Promise<GrowthTimestamps> {
    const createdAfter = { createdAt: { gte: since } };
    const [accounts, guests, households, invites, expenses] = await Promise.all([
      prisma.user.findMany({ where: { ...createdAfter, isGuest: false }, ...pickCreatedAt }),
      prisma.user.findMany({ where: { ...createdAfter, isGuest: true }, ...pickCreatedAt }),
      prisma.household.findMany({ where: createdAfter, ...pickCreatedAt }),
      prisma.householdInvite.findMany({ where: createdAfter, ...pickCreatedAt }),
      prisma.expense.findMany({ where: createdAfter, ...pickCreatedAt }),
    ]);

    return {
      accounts: toDates(accounts),
      guests: toDates(guests),
      households: toDates(households),
      invites: toDates(invites),
      expenses: toDates(expenses),
    };
  }
}

export const growthRepository = new GrowthRepository();
