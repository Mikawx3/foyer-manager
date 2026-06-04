import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-10 text-center">
      <h3 className="text-base font-semibold tracking-tight text-stone-900">{title}</h3>
      <p className="mt-2 text-sm text-stone-600">{description}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
