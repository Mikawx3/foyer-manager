import type { SuggestedSettlement } from "./suggested-settlements.ts";

export type HubStatus =
  | { kind: "solo-empty" }
  | { kind: "solo-month"; expenseCount: number }
  | { kind: "settled" }
  | {
      kind: "owes";
      fromName: string;
      toName: string;
      amount: number;
    };

export function resolveHubStatus(input: {
  isSolo: boolean;
  expenseCount: number;
  suggestions: SuggestedSettlement[];
  nameOf: (tenantId: string) => string;
}): HubStatus {
  if (input.isSolo) {
    if (input.expenseCount === 0) {
      return { kind: "solo-empty" };
    }
    return { kind: "solo-month", expenseCount: input.expenseCount };
  }

  const suggestion = input.suggestions[0];
  if (!suggestion) {
    return { kind: "settled" };
  }

  return {
    kind: "owes",
    fromName: input.nameOf(suggestion.fromTenantId),
    toName: input.nameOf(suggestion.toTenantId),
    amount: suggestion.amount,
  };
}
