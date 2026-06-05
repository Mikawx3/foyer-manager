import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
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
import type { SettlementPeriod } from "@foyer/types";
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
import { queryKeys } from "../lib/query-keys.ts";
import { mutationToastHandlers } from "../lib/toast.ts";
import { buildPercentageMapFromRules } from "../lib/split-percentages.ts";
import { btnPrimary, btnSecondary, card, formCard, inlineError, pageSubtitle } from "../lib/ui-classes.ts";

export function SettingsPage() {
  const { id: householdId = "" } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
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
      successMessage: "Default rule updated",
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
      successMessage: "Default rule updated",
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.defaultSplits(householdId) });
      },
    }),
  });

  const savePeriodMutation = useMutation({
    mutationFn: () => updateHousehold(householdId, { settlementPeriod }),
    ...mutationToastHandlers({
      successMessage: "Balance period updated",
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.household(householdId) });
        void queryClient.invalidateQueries({ queryKey: ["balances", householdId] });
      },
    }),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (categoryId: string) => deleteCategoryDefaultSplits(householdId, categoryId),
    ...mutationToastHandlers({
      successMessage: "Rule reset to global",
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

  const categoryNameById = new Map(categoriesQuery.data?.map((c) => [c.id, c.name]) ?? []);

  const periodOptions: { value: SettlementPeriod; label: string }[] = [
    { value: "none", label: "No reset (cumulative)" },
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "yearly", label: "Yearly" },
  ];

  const isLoading =
    tenantsQuery.isLoading ||
    categoriesQuery.isLoading ||
    rulesQuery.isLoading ||
    householdQuery.isLoading;

  return (
    <div className="space-y-8">
      <p className={pageSubtitle}>Default split rules for this household.</p>

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
          title="No members yet"
          description="Add household members before configuring default splits."
        />
      )}

      {householdQuery.isSuccess && (
        <section className={formCard}>
          <h2 className="text-base font-semibold tracking-tight text-stone-900">Balance period</h2>
          <p className="mt-1 text-sm text-stone-600">How often should balances reset?</p>
          <fieldset className="mt-4 space-y-2">
            {periodOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-sm text-stone-800">
                <input
                  type="radio"
                  name="settlement-period"
                  value={option.value}
                  checked={settlementPeriod === option.value}
                  onChange={() => setSettlementPeriod(option.value)}
                />
                {option.label}
              </label>
            ))}
          </fieldset>
          <p className="mt-3 text-xs text-stone-500">
            Changing this affects how balances are calculated for all members.
          </p>
          <button
            type="button"
            className={`${btnPrimary} mt-4`}
            disabled={
              savePeriodMutation.isPending ||
              settlementPeriod === householdQuery.data.settlementPeriod
            }
            onClick={() => savePeriodMutation.mutate()}
          >
            {savePeriodMutation.isPending ? "Saving…" : "Save period setting"}
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
              Global default split
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Applied to all expenses unless a category has its own rule.
            </p>
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
              {saveGlobalMutation.isPending ? "Saving…" : "Save global rule"}
            </button>
            {saveGlobalMutation.isError && (
              <p className={`mt-2 ${inlineError}`}>
                {getApiErrorMessage(saveGlobalMutation.error)}
              </p>
            )}
          </section>

          <section className={formCard}>
            <h2 className="text-base font-semibold tracking-tight text-stone-900">
              Per-category rules
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Override the global split for specific categories.
            </p>

            {categoriesQuery.isSuccess && categoriesQuery.data.length === 0 && (
              <p className="mt-4 text-sm text-stone-500">
                Create categories on the Expenses page first.
              </p>
            )}

            {categoriesQuery.isSuccess && categoriesQuery.data.length > 0 && (
              <>
                <div className="mt-4 space-y-1">
                  <label htmlFor="settings-category" className="block text-sm font-medium text-stone-700">
                    Category
                  </label>
                  <select
                    id="settings-category"
                    className={selectClassName}
                    value={selectedCategoryId}
                    onChange={(event) => setSelectedCategoryId(event.target.value)}
                  >
                    <option value="" disabled>
                      Select category
                    </option>
                    {categoriesQuery.data.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
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
                      {saveCategoryMutation.isPending ? "Saving…" : "Save rule for this category"}
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
                    <h3 className="text-sm font-semibold text-stone-800">Existing category rules</h3>
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
                            Reset to global
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
        title="Reset split rule"
        message={
          pendingReset
            ? `Reset the split rule for "${pendingReset.name}" to the global default?`
            : ""
        }
        confirmLabel="Reset"
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
        <section className={`${formCard} border-negative/30`}>
          <h2 className="text-base font-semibold tracking-tight text-stone-900">Danger zone</h2>
          <p className="mt-1 text-sm text-stone-600">
            Permanently delete this household and all its data.
          </p>
          <button
            type="button"
            className="mt-4 rounded-lg border border-red-600 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
            onClick={() => setDeleteModalOpen(true)}
          >
            Delete household
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
