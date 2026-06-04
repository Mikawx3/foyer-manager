import type { Category } from "@foyer/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { deleteCategory, getApiErrorMessage } from "../../lib/api.ts";
import { queryKeys } from "../../lib/query-keys.ts";
import { mutationToastHandlers } from "../../lib/toast.ts";
import { card, inlineError } from "../../lib/ui-classes.ts";
import { CategoryBadge } from "../ui/CategoryBadge.tsx";

interface CategoriesSectionProps {
  householdId: string;
  categories: Category[];
}

export function CategoriesSection({ householdId, categories }: CategoriesSectionProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    ...mutationToastHandlers({
      successMessage: "Category removed",
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.categories(householdId) });
      },
    }),
  });

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className={`${card} space-y-3 bg-bg`}>
      <h4 className="text-sm font-semibold tracking-tight text-stone-800">Categories</h4>
      <ul className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <li
            key={category.id}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2 py-1"
          >
            <CategoryBadge name={category.name} />
            <button
              type="button"
              onClick={() => deleteMutation.mutate(category.id)}
              disabled={deleteMutation.isPending}
              className="rounded p-0.5 text-stone-400 transition hover:bg-stone-100 hover:text-negative disabled:opacity-50"
              aria-label={`Delete ${category.name}`}
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
  );
}
