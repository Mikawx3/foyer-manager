import type { CreateRecurringExpensePayload } from "@foyer/types";
import {
  createHousehold,
  createHouseholdTenant,
  createRecurringExpense,
  getCategories,
  getTenants,
  putDefaultSplits,
  updateHousehold,
} from "./api.ts";
import type { WizardState } from "./household-wizard-types.ts";
import { isValidRecurringDraft } from "./household-wizard-types.ts";
import { DEFAULT_TENANT_COLOR } from "./tenant-colors.ts";
import { equalSplitPercentages } from "./split-percentages.ts";

export type WizardSubmitMode = "create" | "setup";

export interface SubmitWizardOptions {
  mode: WizardSubmitMode;
  householdId?: string;
}

function buildRecurringSplits(
  state: WizardState,
  tenantIdByTempId: Map<string, string>,
  tenantIds: string[],
): { tenantId: string; percentage: number }[] {
  if (state.splitMode === "custom" && state.type === "shared") {
    return state.members
      .filter((member) => member.name.trim().length > 0)
      .map((member) => ({
        tenantId: tenantIdByTempId.get(member.tempId) ?? "",
        percentage: state.customSplits[member.tempId] ?? 0,
      }))
      .filter((split) => split.tenantId.length > 0);
  }

  const percentages = equalSplitPercentages(tenantIds.length);
  return tenantIds.map((tenantId, index) => ({
    tenantId,
    percentage: percentages[index] ?? 0,
  }));
}

function resolveCategoryId(
  categoryName: string,
  categoryIdByName: Map<string, string>,
): string | undefined {
  const trimmed = categoryName.trim();
  if (trimmed.length === 0) {
    return categoryIdByName.get("Other");
  }
  return categoryIdByName.get(trimmed) ?? categoryIdByName.get("Other");
}

export async function submitHouseholdWizard(
  state: WizardState,
  options: SubmitWizardOptions,
): Promise<string> {
  if (state.type === null) {
    throw new Error("Household type is required");
  }

  let householdId: string;

  if (options.mode === "setup") {
    if (!options.householdId) {
      throw new Error("Household id is required in setup mode");
    }
    householdId = options.householdId;
    await updateHousehold(householdId, {
      type: state.type,
      settlementPeriod: state.settlementPeriod,
    });
  } else {
    const household = await createHousehold({
      name: state.name.trim(),
      type: state.type,
      settlementPeriod: state.settlementPeriod,
    });
    householdId = household.id;
  }

  let tenantIds: string[] = [];
  const tenantIdByTempId = new Map<string, string>();

  if (state.type === "shared") {
    const filledMembers = state.members.filter((member) => member.name.trim().length > 0);

    for (const member of filledMembers) {
      const tenant = await createHouseholdTenant(householdId, {
        name: member.name.trim(),
        color: member.color,
      });
      tenantIdByTempId.set(member.tempId, tenant.id);
      tenantIds.push(tenant.id);
    }

    if (filledMembers.length > 0) {
      const percentages =
        state.splitMode === "custom"
          ? filledMembers.map((member) => state.customSplits[member.tempId] ?? 0)
          : equalSplitPercentages(tenantIds.length);

      await putDefaultSplits(householdId, {
        categoryId: null,
        splits: filledMembers.map((member, index) => ({
          tenantId: tenantIdByTempId.get(member.tempId) ?? "",
          percentage:
            state.splitMode === "custom"
              ? (state.customSplits[member.tempId] ?? 0)
              : (percentages[index] ?? 0),
        })),
      });
    }
  } else {
    let tenants = await getTenants(householdId);
    if (tenants.length === 0) {
      const me = await createHouseholdTenant(householdId, {
        name: "Me",
        color: DEFAULT_TENANT_COLOR,
      });
      tenants = [me];
    }
    tenantIds = tenants.map((tenant) => tenant.id);
    for (const tenant of tenants) {
      tenantIdByTempId.set(tenant.id, tenant.id);
    }
  }

  if (state.recurring.length > 0) {
    const categories = await getCategories(householdId);
    const categoryIdByName = new Map(categories.map((category) => [category.name, category.id]));
    const defaultPaidById = tenantIds[0] ?? "";
    const validRecurring = state.recurring.filter(isValidRecurringDraft);

    for (const item of validRecurring) {
      const paidById =
        state.type === "shared"
          ? (tenantIdByTempId.get(item.paidByTempId) ?? defaultPaidById)
          : defaultPaidById;

      const categoryId = resolveCategoryId(item.categoryName, categoryIdByName);

      const recurringPayload: CreateRecurringExpensePayload = {
        title: item.title.trim(),
        amount: item.amount,
        frequency: item.frequency,
        startDate: item.startDate,
        paidById,
        ...(categoryId !== undefined && { category: categoryId }),
        ...(state.type === "shared" &&
          state.splitMode === "custom" && {
            splits: buildRecurringSplits(state, tenantIdByTempId, tenantIds),
          }),
      };

      await createRecurringExpense(householdId, recurringPayload);
    }
  }

  return householdId;
}
