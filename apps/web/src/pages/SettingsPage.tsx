import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { selectClassName } from "../components/forms/FormField.tsx";
import {
  isPercentageTotalComplete,
  SmartPercentageInputs,
  totalFromValues,
} from "../components/forms/SmartPercentageInputs.tsx";
import { EmptyState } from "../components/ui/EmptyState.tsx";
import { ErrorMessage } from "../components/ui/ErrorMessage.tsx";
import { ListSkeleton } from "../components/ui/Skeleton.tsx";
import {
  deleteCategoryDefaultSplits,
  getApiErrorMessage,
  getCategories,
  getDefaultSplits,
  getTenants,
  putDefaultSplits,
} from "../lib/api.ts";
import { queryKeys } from "../lib/query-keys.ts";
import { mutationToastHandlers } from "../lib/toast.ts";
import { buildPercentageMapFromRules } from "../lib/split-percentages.ts";
import { btnPrimary, btnSecondary, card, formCard, inlineError, pageSubtitle, pageTitle } from "../lib/ui-classes.ts";

export function SettingsPage() {
  const { id: householdId = "" } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [globalPercentages, setGlobalPercentages] = useState<Record<string, number>>({});
  const [categoryPercentages, setCategoryPercentages] = useState<Record<string, number>>({});
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

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

  const deleteCategoryMutation = useMutation({
    mutationFn: (categoryId: string) => deleteCategoryDefaultSplits(householdId, categoryId),
    ...mutationToastHandlers({
      successMessage: "Rule reset to global",
      onSuccess: () => {
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

  const isLoading =
    tenantsQuery.isLoading || categoriesQuery.isLoading || rulesQuery.isLoading;

  return (
    <div className="space-y-8">
      <div>
        <h1 className={pageTitle}>Settings</h1>
        <p className={pageSubtitle}>Default split rules for this household.</p>
      </div>

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
                            onClick={() => deleteCategoryMutation.mutate(catId)}
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
    </div>
  );
}
