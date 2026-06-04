interface CategoryBadgeProps {
  name: string;
}

function getCategoryColorClass(name: string): string {
  const normalized = name.toLowerCase().trim();

  if (normalized.includes("rent") || normalized.includes("loyer")) {
    return "bg-rent";
  }
  if (normalized.includes("grocer") || normalized.includes("course")) {
    return "bg-groceries";
  }
  if (normalized.includes("utilit") || normalized.includes("energie") || normalized.includes("énergie")) {
    return "bg-utilities";
  }
  if (normalized.includes("internet") || normalized.includes("wifi")) {
    return "bg-internet";
  }

  return "bg-other";
}

export function CategoryBadge({ name }: CategoryBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-stone-600">
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${getCategoryColorClass(name)}`}
        aria-hidden="true"
      />
      {name}
    </span>
  );
}
