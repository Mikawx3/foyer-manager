import type { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  error?: string;
  children: ReactNode;
}

export function FormField({ label, error, children }: FormFieldProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-stone-700">{label}</label>
      {children}
      {error && <p className="text-sm text-negative">{error}</p>}
    </div>
  );
}

export const inputClassName =
  "w-full rounded-lg border border-gray-200 bg-surface px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary";

export const selectClassName = inputClassName;
