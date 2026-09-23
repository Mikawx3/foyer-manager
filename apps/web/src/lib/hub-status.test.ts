import { describe, expect, it } from "vitest";
import { resolveHubStatus } from "./hub-status.ts";

const names = new Map([
  ["alex", "Alex"],
  ["sam", "Sam"],
]);

describe("resolveHubStatus", () => {
  it("talks about the month for a solo household", () => {
    expect(
      resolveHubStatus({
        isSolo: true,
        expenseCount: 0,
        suggestions: [{ fromTenantId: "alex", toTenantId: "sam", amount: 12 }],
        nameOf: (id) => names.get(id) ?? id,
      }),
    ).toEqual({ kind: "solo-empty" });

    expect(
      resolveHubStatus({
        isSolo: true,
        expenseCount: 3,
        suggestions: [],
        nameOf: (id) => names.get(id) ?? id,
      }),
    ).toEqual({ kind: "solo-month", expenseCount: 3 });
  });

  it("says the shared household is settled when nobody owes anyone", () => {
    expect(
      resolveHubStatus({
        isSolo: false,
        expenseCount: 4,
        suggestions: [],
        nameOf: (id) => names.get(id) ?? id,
      }),
    ).toEqual({ kind: "settled" });
  });

  it("surfaces only the first settlement suggestion", () => {
    expect(
      resolveHubStatus({
        isSolo: false,
        expenseCount: 2,
        suggestions: [
          { fromTenantId: "alex", toTenantId: "sam", amount: 42 },
          { fromTenantId: "sam", toTenantId: "alex", amount: 5 },
        ],
        nameOf: (id) => names.get(id) ?? id,
      }),
    ).toEqual({
      kind: "owes",
      fromName: "Alex",
      toName: "Sam",
      amount: 42,
    });
  });
});
