import type { ReactNode } from "react";
import { card } from "../../lib/ui-classes.ts";

interface ChartCardProps {
  title: string;
  children: ReactNode;
  emptyMessage?: string;
  isEmpty?: boolean;
}

export function ChartCard({ title, children, emptyMessage, isEmpty = false }: ChartCardProps) {
  return (
    <div className={card}>
      <h2 className="mb-4 text-sm font-semibold tracking-tight text-stone-900">{title}</h2>
      {isEmpty && emptyMessage ? (
        <p className="py-12 text-center text-sm text-stone-500">{emptyMessage}</p>
      ) : (
        children
      )}
    </div>
  );
}
