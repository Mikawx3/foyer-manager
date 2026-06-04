import { getCategoryBgClass } from "../../lib/category-colors.ts";

interface CategoryBadgeProps {
  name: string;
}

export function CategoryBadge({ name }: CategoryBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-stone-600">
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${getCategoryBgClass(name)}`}
        aria-hidden="true"
      />
      {name}
    </span>
  );
}
