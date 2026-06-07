import type { Category } from "@foyer/types";
import type { TFunction } from "i18next";

export function getCategoryDisplayName(
  category: Pick<Category, "name" | "slug">,
  t: TFunction<"categories">,
): string {
  if (category.slug) {
    return t(category.slug, { defaultValue: category.name });
  }
  return category.name;
}
