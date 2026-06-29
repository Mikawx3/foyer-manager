import type { ReactNode } from "react";
import { card } from "../../lib/ui-classes.ts";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  emptyMessage?: string;
  isEmpty?: boolean;
}

export function ChartCard({ title, subtitle, children, emptyMessage, isEmpty = false }: ChartCardProps) {
  return (
    <div className={`${card} bg-stone-50/30`}>
      <h2 className="text-sm font-medium tracking-tight text-stone-800">{title}</h2>
      {subtitle !== undefined && subtitle !== "" && (
        <p className="mt-1 text-xs leading-relaxed text-stone-500">{subtitle}</p>
      )}
      <div className="mt-4 min-w-0">
        {isEmpty && emptyMessage ? (
          <p className="py-12 text-center text-sm text-stone-500">{emptyMessage}</p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
