import type { CreateHouseholdPayload, CreateRecurringExpensePayload } from "@foyer/types";
import {
  createHousehold,
  createHouseholdTenant,
  createRecurringExpense,
  getCategories,
  getTenants,
  putDefaultSplits,
} from "./api.ts";
import type { WizardState } from "./household-wizard-types.ts";
import { equalSplitPercentages } from "./split-percentages.ts";

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

export async function submitHouseholdWizard(state: WizardState): Promise<string> {
  if (state.type === null) {
    throw new Error("Household type is required");
  }

  const payload: CreateHouseholdPayload = {
    name: state.name.trim(),
    type: state.type,
    settlementPeriod: state.settlementPeriod,
  };

  const household = await createHousehold(payload);

  let tenantIds: string[] = [];
  const tenantIdByTempId = new Map<string, string>();

  if (state.type === "shared") {
    const filledMembers = state.members.filter((member) => member.name.trim().length > 0);

    for (const member of filledMembers) {
      const tenant = await createHouseholdTenant(household.id, {
        name: member.name.trim(),
        color: member.color,
      });
      tenantIdByTempId.set(member.tempId, tenant.id);
      tenantIds.push(tenant.id);
    }

    if (state.splitMode === "custom") {
      await putDefaultSplits(household.id, {
        categoryId: null,
        splits: filledMembers.map((member) => ({
          tenantId: tenantIdByTempId.get(member.tempId) ?? "",
          percentage: state.customSplits[member.tempId] ?? 0,
        })),
      });
    }
  } else {
    const tenants = await getTenants(household.id);
    tenantIds = tenants.map((tenant) => tenant.id);
    for (const tenant of tenants) {
      tenantIdByTempId.set(tenant.id, tenant.id);
    }
  }

  if (state.recurring.length > 0) {
    const categories = await getCategories(household.id);
    const categoryIdByName = new Map(categories.map((category) => [category.name, category.id]));
    const defaultPaidById = tenantIds[0] ?? "";

    for (const item of state.recurring) {
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
        splits: buildRecurringSplits(state, tenantIdByTempId, tenantIds),
        ...(categoryId !== undefined && { category: categoryId }),
      };

      await createRecurringExpense(household.id, recurringPayload);
    }
  }

  return household.id;
}
