import type { HouseholdType, RecurringFrequency, SettlementPeriod } from "@foyer/types";
import { generateUUID } from "./random-id.ts";
import { DEFAULT_TENANT_COLOR } from "./tenant-colors.ts";

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

export type SplitMode = "equal" | "custom";

export interface WizardMember {
  tempId: string;
  name: string;
  color: string;
}

export interface RecurringQuickAddChip {
  emoji: string;
  label: string;
  categoryName: string;
}

export interface RecurringDraft {
  tempId: string;
  title: string;
  categoryName: string;
  amount: number;
  frequency: RecurringFrequency;
  startDate: string;
  paidByTempId: string;
}

export type RecurringUpdater =
  | RecurringDraft[]
  | ((previous: RecurringDraft[]) => RecurringDraft[]);

export function applyRecurringUpdater(
  previous: RecurringDraft[],
  updater: RecurringUpdater,
): RecurringDraft[] {
  return typeof updater === "function" ? updater(previous) : updater;
}

export function isValidRecurringDraft(item: RecurringDraft): boolean {
  return item.title.trim().length > 0 && !Number.isNaN(item.amount) && item.amount > 0;
}

export interface WizardState {
  step: WizardStep;
  type: HouseholdType | null;
  name: string;
  members: WizardMember[];
  splitMode: SplitMode;
  customSplits: Record<string, number>;
  recurring: RecurringDraft[];
  settlementPeriod: SettlementPeriod;
}

export const RECURRING_QUICK_ADD: RecurringQuickAddChip[] = [
  { emoji: "🏠", label: "Rent", categoryName: "Rent" },
  { emoji: "🌐", label: "Internet", categoryName: "Internet" },
  { emoji: "⚡", label: "Electricity", categoryName: "Utilities" },
  { emoji: "💧", label: "Water", categoryName: "Water" },
  { emoji: "📺", label: "Streaming", categoryName: "Streaming" },
  { emoji: "➕", label: "Other", categoryName: "Other" },
];

export function createMemberId(): string {
  return generateUUID();
}

export function firstOfCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

export function initialWizardState(): WizardState {
  return {
    step: 1,
    type: null,
    name: "",
    members: [{ tempId: createMemberId(), name: "", color: DEFAULT_TENANT_COLOR }],
    splitMode: "equal",
    customSplits: {},
    recurring: [],
    settlementPeriod: "monthly",
  };
}

export function getNextStep(step: WizardStep, type: HouseholdType | null): WizardStep {
  if (step === 2 && type === "solo") {
    return 4;
  }
  return Math.min(step + 1, 6) as WizardStep;
}

export function getPrevStep(step: WizardStep, type: HouseholdType | null): WizardStep {
  if (step === 4 && type === "solo") {
    return 2;
  }
  return Math.max(step - 1, 1) as WizardStep;
}

export function settlementPeriodLabel(period: SettlementPeriod): string {
  switch (period) {
    case "monthly":
      return "Monthly";
    case "quarterly":
      return "Quarterly";
    case "yearly":
      return "Yearly";
    default:
      return "No period — all-time balances";
  }
}
