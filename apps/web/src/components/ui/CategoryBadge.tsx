import { useTranslation } from "react-i18next";
import type { CategoryColorKey } from "@foyer/types";
import { getCategoryBgClass, getCategoryInlineStyle } from "../../lib/category-colors.ts";
import { getCategoryDisplayName } from "../../lib/category-label.ts";

interface CategoryBadgeProps {
  name: string;
  slug?: string | null;
  color?: CategoryColorKey;
}

export function CategoryBadge({ name, slug, color }: CategoryBadgeProps) {
  const { t } = useTranslation("categories");
  const label = getCategoryDisplayName({ name, slug }, t);
  const inlineStyle = getCategoryInlineStyle(color);

  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-stone-600">
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${inlineStyle ? "" : getCategoryBgClass(name, slug, color)}`}
        style={inlineStyle}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
