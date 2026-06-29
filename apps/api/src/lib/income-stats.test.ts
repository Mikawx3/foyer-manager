import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import {
  resolveIncomesForMonth,
  sumResolvedIncomesForMonth,
} from "./income-stats.js";

const householdId = "clh12345678901234567890123";
const tenantId = "clt12345678901234567890123";

function template(amount: number, label = "Salary") {
  return {
    id: "tpl12345678901234567890123",
    householdId,
    tenantId,
    amount: new Prisma.Decimal(amount),
    label,
    note: null,
    active: true,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  };
}

function override(amount: number, month: string, label = "Salary") {
  return {
    id: "inc12345678901234567890123",
    householdId,
    tenantId,
    amount: new Prisma.Decimal(amount),
    label,
    month,
    note: null,
    createdAt: new Date("2026-06-01"),
    updatedAt: new Date("2026-06-01"),
  };
}

describe("income-stats resolve", () => {
  it("uses template amount when no override exists", () => {
    const resolved = resolveIncomesForMonth([template(3000)], [], "2026-06");
    expect(resolved).toHaveLength(1);
    expect(resolved[0]?.amount).toBe(3000);
    expect(resolved[0]?.source).toBe("template");
  });

  it("prioritizes month override over template", () => {
    const resolved = resolveIncomesForMonth(
      [template(3000)],
      [override(3500, "2026-06")],
      "2026-06",
    );
    expect(resolved[0]?.amount).toBe(3500);
    expect(resolved[0]?.source).toBe("override");
    expect(resolved[0]?.templateId).toBeDefined();
  });

  it("uses template for other months when override is month-specific", () => {
    expect(
      sumResolvedIncomesForMonth([template(3000)], [override(3500, "2026-06")], "2026-05"),
    ).toBe(3000);
    expect(
      sumResolvedIncomesForMonth([template(3000)], [override(3500, "2026-06")], "2026-06"),
    ).toBe(3500);
  });

  it("includes one-off income without template", () => {
    const resolved = resolveIncomesForMonth(
      [],
      [override(500, "2026-06", "Bonus")],
      "2026-06",
    );
    expect(resolved).toHaveLength(1);
    expect(resolved[0]?.source).toBe("one-off");
    expect(resolved[0]?.label).toBe("Bonus");
  });
});
