import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { CategoriesSection } from "../components/expenses/CategoriesSection.tsx";
import { CategoryForm } from "../components/forms/CategoryForm.tsx";
import { ErrorMessage } from "../components/ui/ErrorMessage.tsx";
import { ListSkeleton } from "../components/ui/Skeleton.tsx";
import { createCategory, getApiErrorMessage, getCategories } from "../lib/api.ts";
import { queryKeys } from "../lib/query-keys.ts";
import { mutationToastHandlers } from "../lib/toast.ts";
import { inlineError } from "../lib/ui-classes.ts";

export function CategoriesSettingsPage() {
  const { id: householdId = "" } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { t: tToast } = useTranslation("toast");

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories(householdId),
    queryFn: () => getCategories(householdId),
    enabled: Boolean(householdId),
  });

  const createCategoryMutation = useMutation({
    mutationFn: createCategory,
    ...mutationToastHandlers({
      successMessage: tToast("categoryAdded"),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.categories(householdId) });
      },
    }),
  });

  return (
    <div className="space-y-6">
      {categoriesQuery.isLoading && <ListSkeleton />}
      {categoriesQuery.isError && (
        <ErrorMessage
          message={getApiErrorMessage(categoriesQuery.error)}
          onRetry={() => categoriesQuery.refetch()}
        />
      )}

      {categoriesQuery.isSuccess && (
        <div className="space-y-4">
          {categoriesQuery.data.length > 0 && (
            <CategoriesSection householdId={householdId} categories={categoriesQuery.data} />
          )}
          <CategoryForm
            householdId={householdId}
            onSubmit={(data) => createCategoryMutation.mutate(data)}
            isPending={createCategoryMutation.isPending}
          />
          {createCategoryMutation.error !== undefined && createCategoryMutation.error !== null && (
            <p className={inlineError}>{getApiErrorMessage(createCategoryMutation.error)}</p>
          )}
        </div>
      )}
    </div>
  );
}
