import { Skeleton } from "../ui/Skeleton.tsx";

export function KpiGridSkeleton() {
  return (
    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-2 md:gap-3 md:overflow-visible md:px-0 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-[88px] min-w-[148px] shrink-0 rounded-2xl md:min-w-0 md:h-24" />
      ))}
    </div>
  );
}
