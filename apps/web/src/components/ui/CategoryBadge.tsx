import { useTranslation } from "react-i18next";
import { getCategoryBgClass } from "../../lib/category-colors.ts";
import { getCategoryDisplayName } from "../../lib/category-label.ts";

interface CategoryBadgeProps {
  name: string;
  slug?: string | null;
}

export function CategoryBadge({ name, slug }: CategoryBadgeProps) {
  const { t } = useTranslation("categories");
  const label = getCategoryDisplayName({ name, slug }, t);

  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-stone-600">
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${getCategoryBgClass(slug ?? name)}`}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
