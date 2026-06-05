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
  labelKey: keyof typeof RECURRING_QUICK_ADD_LABEL_KEYS;
  categoryKey: keyof typeof RECURRING_QUICK_ADD_CATEGORY_KEYS;
}

export const RECURRING_QUICK_ADD_LABEL_KEYS = {
  rent: "quickAddRent",
  internet: "quickAddInternet",
  electricity: "quickAddElectricity",
  water: "quickAddWater",
  streaming: "quickAddStreaming",
  other: "quickAddOther",
} as const;

export const RECURRING_QUICK_ADD_CATEGORY_KEYS = {
  rent: "quickAddCategoryRent",
  internet: "quickAddCategoryInternet",
  electricity: "quickAddCategoryUtilities",
  water: "quickAddCategoryWater",
  streaming: "quickAddCategoryStreaming",
  other: "quickAddCategoryOther",
} as const;

export const RECURRING_QUICK_ADD: RecurringQuickAddChip[] = [
  { emoji: "🏠", labelKey: "rent", categoryKey: "rent" },
  { emoji: "🌐", labelKey: "internet", categoryKey: "internet" },
  { emoji: "⚡", labelKey: "electricity", categoryKey: "electricity" },
  { emoji: "💧", labelKey: "water", categoryKey: "water" },
  { emoji: "📺", labelKey: "streaming", categoryKey: "streaming" },
  { emoji: "➕", labelKey: "other", categoryKey: "other" },
];

export const RECURRING_QUICK_ADD_CANONICAL_CATEGORIES: Record<
  RecurringQuickAddChip["categoryKey"],
  string
> = {
  rent: "Rent",
  internet: "Internet",
  electricity: "Utilities",
  water: "Water",
  streaming: "Streaming",
  other: "Other",
};

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

export function settlementPeriodTranslationKey(period: SettlementPeriod): string {
  switch (period) {
    case "monthly":
      return "settlementPeriodMonthly";
    case "quarterly":
      return "settlementPeriodQuarterly";
    case "yearly":
      return "settlementPeriodYearly";
    default:
      return "settlementPeriodNone";
  }
}

export function recurringCategoryTranslationKey(
  canonicalCategoryName: string,
): keyof typeof RECURRING_QUICK_ADD_CATEGORY_KEYS | null {
  for (const [key, name] of Object.entries(RECURRING_QUICK_ADD_CANONICAL_CATEGORIES)) {
    if (name === canonicalCategoryName) {
      return key as keyof typeof RECURRING_QUICK_ADD_CATEGORY_KEYS;
    }
  }
  return null;
}
