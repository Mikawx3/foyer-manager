import type { Category } from "@foyer/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { deleteCategory, getApiErrorMessage } from "../../lib/api.ts";
import { queryKeys } from "../../lib/query-keys.ts";
import { mutationToastHandlers } from "../../lib/toast.ts";
import { card, inlineError } from "../../lib/ui-classes.ts";
import { CategoryBadge } from "../ui/CategoryBadge.tsx";
import { ConfirmModal } from "../ui/ConfirmModal.tsx";

interface CategoriesSectionProps {
  householdId: string;
  categories: Category[];
}

type PendingCategoryDelete = { id: string; name: string };

export function CategoriesSection({ householdId, categories }: CategoriesSectionProps) {
  const { t } = useTranslation("expenses");
  const { t: tCommon } = useTranslation("common");
  const { t: tToast } = useTranslation("toast");
  const queryClient = useQueryClient();
  const [pendingDelete, setPendingDelete] = useState<PendingCategoryDelete | null>(null);

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    ...mutationToastHandlers({
      successMessage: tToast("categoryRemoved"),
      onSuccess: () => {
        setPendingDelete(null);
        void queryClient.invalidateQueries({ queryKey: queryKeys.categories(householdId) });
      },
    }),
  });

  if (categories.length === 0) {
    return null;
  }

  return (
    <>
      <div className={`${card} space-y-3 bg-bg`}>
        <h4 className="text-sm font-semibold tracking-tight text-stone-800">{t("categoriesHeading")}</h4>
        <ul className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <li
              key={category.id}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2 py-1"
            >
              <CategoryBadge name={category.name} />
              <button
                type="button"
                onClick={() => setPendingDelete({ id: category.id, name: category.name })}
                disabled={deleteMutation.isPending}
                className="rounded p-0.5 text-stone-400 transition hover:bg-stone-100 hover:text-negative disabled:opacity-50"
                aria-label={tCommon("deleteItem", { name: category.name })}
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </li>
          ))}
        </ul>
        {deleteMutation.isError && (
          <p className={inlineError}>{getApiErrorMessage(deleteMutation.error)}</p>
        )}
      </div>

      <ConfirmModal
        isOpen={pendingDelete !== null}
        title={t("deleteCategoryTitle")}
        message={
          pendingDelete
            ? t("deleteCategoryMessage", { name: pendingDelete.name })
            : ""
        }
        onConfirm={() => {
          if (pendingDelete) {
            deleteMutation.mutate(pendingDelete.id);
          }
        }}
        onCancel={() => setPendingDelete(null)}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
