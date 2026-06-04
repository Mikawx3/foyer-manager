export const pageTitle = "text-2xl font-semibold tracking-tight text-stone-900";

export const pageSubtitle = "mt-1 text-sm text-stone-600";

export const card =
  "rounded-xl border border-border bg-surface p-4 shadow-sm transition hover:shadow-md";

export const cardInteractive =
  "block rounded-xl border border-border bg-surface p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md";

export const btnPrimary =
  "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50";

export const btnSecondary =
  "text-sm font-medium text-primary hover:text-primary-hover disabled:opacity-50";

export const amount = "font-mono tabular-nums font-semibold text-stone-900";

export const amountLg = `${amount} text-lg`;

export const formCard = `${card} space-y-4`;

export const inlineError = "text-sm text-negative";

export const householdNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
    isActive
      ? "bg-primary text-white shadow-sm"
      : "text-stone-700 hover:bg-stone-100"
  }`;

export const pageActionsRow = "flex flex-wrap items-start justify-between gap-4";

export const stickyFormPanel =
  "hidden xl:block xl:w-80 xl:shrink-0 xl:sticky xl:top-24 xl:self-start space-y-4";
