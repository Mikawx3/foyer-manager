interface SplitModeToggleProps {
  useAutoSplit: boolean;
  onChange: (useAutoSplit: boolean) => void;
}

export function SplitModeToggle({ useAutoSplit, onChange }: SplitModeToggleProps) {
  return (
    <div
      className="inline-flex rounded-lg border border-border bg-stone-100 p-0.5"
      role="group"
      aria-label="Split mode"
    >
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
          useAutoSplit
            ? "bg-surface text-stone-900 shadow-sm"
            : "text-stone-600 hover:text-stone-900"
        }`}
      >
        Auto split ✓
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
          !useAutoSplit
            ? "bg-surface text-stone-900 shadow-sm"
            : "text-stone-600 hover:text-stone-900"
        }`}
      >
        Customize
      </button>
    </div>
  );
}
