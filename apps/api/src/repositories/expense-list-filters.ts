import type { Prisma } from "@prisma/client";
import { numberToDecimal } from "../lib/decimal.js";

export type ParticipantScope = "shared" | "personal" | "all";

export interface ExpenseListFilterInput {
  householdId: string;
  categoryId?: string;
  month?: string;
  search?: string;
  /**
   * Restrict by who participates in the expense.
   * Requires `householdTenantIds` when set to `shared` or `personal`.
   * - shared: every household member is a participant (default split, or custom covering all)
   * - personal: at least one household member is excluded
   * - all: no participant filter
   */
  participantScope?: ParticipantScope;
  /** Active household member ids used when applying `participantScope`. */
  householdTenantIds?: string[];
}

export function monthToDateRange(month: string): { gte: Date; lt: Date } {
  const [yearStr, monthStr] = month.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  const gte = new Date(year, monthIndex, 1);
  const lt = new Date(year, monthIndex + 1, 1);
  return { gte, lt };
}

export function buildParticipantScopeWhere(
  scope: ParticipantScope,
  householdTenantIds: string[],
): Prisma.ExpenseWhereInput | null {
  if (scope === "all" || householdTenantIds.length <= 1) {
    return null;
  }

  const hasEveryTenant: Prisma.ExpenseWhereInput[] = householdTenantIds.map((tenantId) => ({
    splits: { some: { tenantId } },
  }));

  if (scope === "shared") {
    return {
      OR: [
        { splitMode: "default" },
        {
          AND: [{ splitMode: "custom" }, ...hasEveryTenant],
        },
      ],
    };
  }

  return {
    AND: [
      { splitMode: "custom" },
      {
        OR: householdTenantIds.map((tenantId) => ({
          splits: { none: { tenantId } },
        })),
      },
    ],
  };
}

export function buildExpenseListWhere(
  filters: ExpenseListFilterInput,
): Prisma.ExpenseWhereInput {
  const conditions: Prisma.ExpenseWhereInput[] = [{ householdId: filters.householdId }];

  if (filters.categoryId) {
    conditions.push({ categoryId: filters.categoryId });
  }

  if (filters.month) {
    const { gte, lt } = monthToDateRange(filters.month);
    conditions.push({ date: { gte, lt } });
  }

  const search = filters.search?.trim();
  if (search) {
    const orConditions: Prisma.ExpenseWhereInput[] = [
      { description: { contains: search, mode: "insensitive" } },
      { paidByTenant: { name: { contains: search, mode: "insensitive" } } },
    ];
    const normalizedAmount = search.replace(",", ".");
    const parsedAmount = Number(normalizedAmount);
    if (Number.isFinite(parsedAmount) && parsedAmount > 0) {
      orConditions.push({ amount: { equals: numberToDecimal(parsedAmount) } });
    }
    conditions.push({ OR: orConditions });
  }

  const scope = filters.participantScope ?? "all";
  const scopeWhere = buildParticipantScopeWhere(
    scope,
    filters.householdTenantIds ?? [],
  );
  if (scopeWhere) {
    conditions.push(scopeWhere);
  }

  if (conditions.length === 1) {
    return conditions[0] ?? { householdId: filters.householdId };
  }

  return { AND: conditions };
}
