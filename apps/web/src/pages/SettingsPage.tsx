import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import type { SettlementPeriod } from "@foyer/types";
import { DeleteHouseholdModal } from "../components/settings/DeleteHouseholdModal.tsx";
import { selectClassName } from "../components/forms/FormField.tsx";
import {
  isPercentageTotalComplete,
  SmartPercentageInputs,
  totalFromValues,
} from "../components/forms/SmartPercentageInputs.tsx";
import { ConfirmModal } from "../components/ui/ConfirmModal.tsx";
import { EmptyState } from "../components/ui/EmptyState.tsx";
import { ErrorMessage } from "../components/ui/ErrorMessage.tsx";
import { ListSkeleton } from "../components/ui/Skeleton.tsx";
import {
  deleteCategoryDefaultSplits,
  getApiErrorMessage,
  getCategories,
  getDefaultSplits,
  getHousehold,
  getTenants,
  putDefaultSplits,
  updateHousehold,
} from "../lib/api.ts";
import { getCategoryDisplayName } from "../lib/category-label.ts";
import { queryKeys } from "../lib/query-keys.ts";
import { mutationToastHandlers } from "../lib/toast.ts";
import { buildPercentageMapFromRules } from "../lib/split-percentages.ts";
import { btnPrimary, btnSecondary, card, formCard, inlineError, pageSubtitle } from "../lib/ui-classes.ts";

export function SettingsPage() {
  const { id: householdId = "" } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { t } = useTranslation("settings");
  const { t: tCommon } = useTranslation("common");
  const { t: tMembers } = useTranslation("members");
  const { t: tToast } = useTranslation("toast");
  const { t: tCategories } = useTranslation("categories");

  const [globalPercentages, setGlobalPercentages] = useState<Record<string, number>>({});
  const [categoryPercentages, setCategoryPercentages] = useState<Record<string, number>>({});
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [pendingReset, setPendingReset] = useState<{ id: string; name: string } | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [settlementPeriod, setSettlementPeriod] = useState<SettlementPeriod>("none");

  const householdQuery = useQuery({
    queryKey: queryKeys.household(householdId),
    queryFn: () => getHousehold(householdId),
    enabled: Boolean(householdId),
  });

  const tenantsQuery = useQuery({
    queryKey: queryKeys.tenants(householdId),
    queryFn: () => getTenants(householdId),
    enabled: Boolean(householdId),
  });

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories(householdId),
    queryFn: () => getCategories(householdId),
    enabled: Boolean(householdId),
  });

  const rulesQuery = useQuery({
    queryKey: queryKeys.defaultSplits(householdId),
    queryFn: () => getDefaultSplits(householdId),
    enabled: Boolean(householdId),
  });

  const tenants = tenantsQuery.data ?? [];
  const tenantIds = useMemo(() => tenants.map((tenant) => tenant.id), [tenants]);

  useEffect(() => {
    if (householdQuery.data) {
      setSettlementPeriod(householdQuery.data.settlementPeriod);
    }
  }, [householdQuery.data]);

  useEffect(() => {
    if (!rulesQuery.data || tenantIds.length === 0) {
      return;
    }
    setGlobalPercentages(
      buildPercentageMapFromRules(tenantIds, rulesQuery.data.global),
    );
  }, [rulesQuery.data, tenantIds]);

  useEffect(() => {
    if (!rulesQuery.data || tenantIds.length === 0 || selectedCategoryId === "") {
      return;
    }
    const categoryRules = rulesQuery.data.byCategory[selectedCategoryId] ?? [];
    setCategoryPercentages(buildPercentageMapFromRules(tenantIds, categoryRules));
  }, [rulesQuery.data, tenantIds, selectedCategoryId]);

  const saveGlobalMutation = useMutation({
    mutationFn: () =>
      putDefaultSplits(householdId, {
        categoryId: null,
        splits: tenants.map((tenant) => ({
          tenantId: tenant.id,
          percentage: globalPercentages[tenant.id] ?? 0,
        })),
      }),
    ...mutationToastHandlers({
      successMessage: tToast("defaultRuleUpdated"),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.defaultSplits(householdId) });
      },
    }),
  });

  const saveCategoryMutation = useMutation({
    mutationFn: () =>
      putDefaultSplits(householdId, {
        categoryId: selectedCategoryId,
        splits: tenants.map((tenant) => ({
          tenantId: tenant.id,
          percentage: categoryPercentages[tenant.id] ?? 0,
        })),
      }),
    ...mutationToastHandlers({
      successMessage: tToast("defaultRuleUpdated"),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.defaultSplits(householdId) });
      },
    }),
  });

  const savePeriodMutation = useMutation({
    mutationFn: () => updateHousehold(householdId, { settlementPeriod }),
    ...mutationToastHandlers({
      successMessage: tToast("balancePeriodUpdated"),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.household(householdId) });
        void queryClient.invalidateQueries({ queryKey: ["balances", householdId] });
      },
    }),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (categoryId: string) => deleteCategoryDefaultSplits(householdId, categoryId),
    ...mutationToastHandlers({
      successMessage: tToast("ruleResetToGlobal"),
      onSuccess: () => {
        setPendingReset(null);
        void queryClient.invalidateQueries({ queryKey: queryKeys.defaultSplits(householdId) });
      },
    }),
  });

  const globalTotal = totalFromValues(globalPercentages, tenantIds);
  const globalValid = isPercentageTotalComplete(globalTotal);

  const categoryTotal = totalFromValues(categoryPercentages, tenantIds);
  const categoryValid = isPercentageTotalComplete(categoryTotal);

  const tenantItems = tenants.map((tenant) => ({ id: tenant.id, label: tenant.name }));

  const categoryOverrides = rulesQuery.data
    ? Object.entries(rulesQuery.data.byCategory)
    : [];

  const categoryNameById = new Map(
    categoriesQuery.data?.map((category) => [
      category.id,
      getCategoryDisplayName(category, tCategories),
    ]) ?? [],
  );

  const periodOptions: { value: SettlementPeriod; label: string }[] = [
    { value: "none", label: t("periodNone") },
    { value: "monthly", label: tCommon("monthly") },
    { value: "quarterly", label: tCommon("quarterly") },
    { value: "yearly", label: tCommon("yearly") },
  ];

  const isLoading =
    tenantsQuery.isLoading ||
    categoriesQuery.isLoading ||
    rulesQuery.isLoading ||
    householdQuery.isLoading;

  return (
    <div className="space-y-8">
      <p className={pageSubtitle}>{t("subtitle")}</p>

      {isLoading && <ListSkeleton />}
      {(tenantsQuery.isError || categoriesQuery.isError || rulesQuery.isError) && (
        <ErrorMessage
          message={getApiErrorMessage(
            tenantsQuery.error ?? categoriesQuery.error ?? rulesQuery.error,
          )}
          onRetry={() => {
            void tenantsQuery.refetch();
            void categoriesQuery.refetch();
            void rulesQuery.refetch();
          }}
        />
      )}

      {tenantsQuery.isSuccess && tenants.length === 0 && (
        <EmptyState
          title={tMembers("noMembersTitle")}
          description={tMembers("noMembersDescriptionSettings")}
        />
      )}

      {householdQuery.isSuccess && (
        <section className={formCard}>
          <h2 className="text-base font-semibold tracking-tight text-stone-900">{t("balancePeriod")}</h2>
          <p className="mt-1 text-sm text-stone-600">{t("balancePeriodDescription")}</p>
          <fieldset className="mt-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-1 md:gap-2">
              {periodOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 py-3 text-sm transition active:scale-[0.99] md:rounded-lg md:border-0 md:px-0 md:py-0 ${
                    settlementPeriod === option.value
                      ? "border-primary bg-primary/5 text-stone-900 md:border-0 md:bg-transparent"
                      : "border-border bg-bg text-stone-800 md:border-0 md:bg-transparent"
                  }`}
                >
                  <input
                    type="radio"
                    name="settlement-period"
                    value={option.value}
                    checked={settlementPeriod === option.value}
                    onChange={() => setSettlementPeriod(option.value)}
                    className="shrink-0"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>
          <p className="mt-3 text-xs text-stone-500">{t("balancePeriodHint")}</p>
          <button
            type="button"
            className={`${btnPrimary} mt-4`}
            disabled={
              savePeriodMutation.isPending ||
              settlementPeriod === householdQuery.data.settlementPeriod
            }
            onClick={() => savePeriodMutation.mutate()}
          >
            {savePeriodMutation.isPending ? tCommon("saving") : t("savePeriodSetting")}
          </button>
          {savePeriodMutation.isError && (
            <p className={`mt-2 ${inlineError}`}>
              {getApiErrorMessage(savePeriodMutation.error)}
            </p>
          )}
        </section>
      )}

      {tenantsQuery.isSuccess && tenants.length > 0 && rulesQuery.isSuccess && (
        <>
          <section className={formCard}>
            <h2 className="text-base font-semibold tracking-tight text-stone-900">
              {t("globalDefaultSplit")}
            </h2>
            <p className="mt-1 text-sm text-stone-600">{t("globalDefaultSplitDescription")}</p>
            <div className="mt-4">
              <SmartPercentageInputs
                items={tenantItems}
                values={globalPercentages}
                onChange={setGlobalPercentages}
              />
            </div>
            <button
              type="button"
              className={`${btnPrimary} mt-4`}
              disabled={!globalValid || saveGlobalMutation.isPending}
              onClick={() => saveGlobalMutation.mutate()}
            >
              {saveGlobalMutation.isPending ? tCommon("saving") : t("saveGlobalRule")}
            </button>
            {saveGlobalMutation.isError && (
              <p className={`mt-2 ${inlineError}`}>
                {getApiErrorMessage(saveGlobalMutation.error)}
              </p>
            )}
          </section>

          <section className={formCard}>
            <h2 className="text-base font-semibold tracking-tight text-stone-900">
              {t("perCategoryRules")}
            </h2>
            <p className="mt-1 text-sm text-stone-600">{t("perCategoryRulesDescription")}</p>

            {categoriesQuery.isSuccess && categoriesQuery.data.length === 0 && (
              <p className="mt-4 text-sm text-stone-500">{t("createCategoriesFirst")}</p>
            )}

            {categoriesQuery.isSuccess && categoriesQuery.data.length > 0 && (
              <>
                <div className="mt-4 space-y-1">
                  <label htmlFor="settings-category" className="block text-sm font-medium text-stone-700">
                    {tCommon("category")}
                  </label>
                  <select
                    id="settings-category"
                    className={selectClassName}
                    value={selectedCategoryId}
                    onChange={(event) => setSelectedCategoryId(event.target.value)}
                  >
                    <option value="" disabled>
                      {tCommon("selectCategory")}
                    </option>
                    {categoriesQuery.data.map((category) => (
                      <option key={category.id} value={category.id}>
                        {getCategoryDisplayName(category, tCategories)}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCategoryId !== "" && (
                  <>
                    <div className="mt-4">
                      <SmartPercentageInputs
                        items={tenantItems}
                        values={categoryPercentages}
                        onChange={setCategoryPercentages}
                      />
                    </div>
                    <button
                      type="button"
                      className={`${btnPrimary} mt-4`}
                      disabled={!categoryValid || saveCategoryMutation.isPending}
                      onClick={() => saveCategoryMutation.mutate()}
                    >
                      {saveCategoryMutation.isPending ? tCommon("saving") : t("saveRuleForCategory")}
                    </button>
                    {saveCategoryMutation.isError && (
                      <p className={`mt-2 ${inlineError}`}>
                        {getApiErrorMessage(saveCategoryMutation.error)}
                      </p>
                    )}
                  </>
                )}

                {categoryOverrides.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-stone-800">{t("existingCategoryRules")}</h3>
                    <ul className="mt-2 space-y-2">
                      {categoryOverrides.map(([catId]) => (
                        <li
                          key={catId}
                          className={`${card} flex flex-wrap items-center justify-between gap-2`}
                        >
                          <span className="text-sm font-medium text-stone-900">
                            {categoryNameById.get(catId) ?? catId}
                          </span>
                          <button
                            type="button"
                            className={btnSecondary}
                            disabled={deleteCategoryMutation.isPending}
                            onClick={() =>
                              setPendingReset({
                                id: catId,
                                name: categoryNameById.get(catId) ?? catId,
                              })
                            }
                          >
                            {t("resetToGlobal")}
                          </button>
                        </li>
                      ))}
                    </ul>
                    {deleteCategoryMutation.isError && (
                      <p className={`mt-2 ${inlineError}`}>
                        {getApiErrorMessage(deleteCategoryMutation.error)}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        </>
      )}

      <ConfirmModal
        isOpen={pendingReset !== null}
        title={t("resetSplitRuleTitle")}
        message={
          pendingReset
            ? t("resetSplitRuleMessage", { name: pendingReset.name })
            : ""
        }
        confirmLabel={tCommon("reset")}
        variant="warning"
        onConfirm={() => {
          if (pendingReset) {
            deleteCategoryMutation.mutate(pendingReset.id);
          }
        }}
        onCancel={() => setPendingReset(null)}
        isLoading={deleteCategoryMutation.isPending}
      />

      {householdQuery.isSuccess && (
        <section className={`${formCard} border-2 border-red-200`}>
          <h2 className="text-base font-semibold tracking-tight text-stone-900">{t("dangerZone")}</h2>
          <p className="mt-1 text-sm text-stone-600">{t("dangerZoneDescription")}</p>
          <button
            type="button"
            className="mt-4 min-h-11 w-full rounded-lg border-2 border-red-600 px-4 py-2 text-base font-medium text-red-600 transition hover:bg-red-50 active:bg-red-100 active:scale-[0.99] md:w-auto md:text-sm"
            onClick={() => setDeleteModalOpen(true)}
          >
            {t("deleteHousehold")}
          </button>
        </section>
      )}

      {householdQuery.isSuccess && (
        <DeleteHouseholdModal
          isOpen={deleteModalOpen}
          householdId={householdId}
          householdName={householdQuery.data.name}
          onClose={() => setDeleteModalOpen(false)}
        />
      )}
    </div>
  );
}
