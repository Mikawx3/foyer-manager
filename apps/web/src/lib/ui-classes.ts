export const pageTitle = "text-lg font-semibold tracking-tight text-stone-900 md:text-2xl";

export const pageSubtitle = "mt-1 text-base text-stone-600 md:text-sm";

export const card =
  "rounded-2xl border border-stone-200/50 bg-surface p-4 shadow-none transition";

export const cardInteractive =
  "block rounded-2xl border border-stone-200/50 bg-surface p-4 shadow-none transition hover:border-primary/20 hover:bg-stone-50/80 active:bg-stone-100/60";

export const kpiCard =
  "@container min-w-0 rounded-2xl bg-stone-100/50 p-4 ring-1 ring-stone-200/35";

export const kpiCardInteractive =
  `${kpiCard} block transition hover:bg-stone-100/70 hover:ring-primary/15 active:bg-stone-100/90`;

export const kpiAmount =
  "font-semibold tabular-nums tracking-tight text-stone-900 text-[clamp(0.875rem,11cqw,1.25rem)] leading-tight";

export const btnPrimary =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 py-2 text-base font-medium text-white hover:bg-primary-hover active:scale-[0.98] active:opacity-90 disabled:opacity-50 md:text-sm";

export const btnSecondary =
  "inline-flex min-h-11 items-center justify-center text-base font-medium text-primary hover:text-primary-hover active:scale-[0.98] active:opacity-80 disabled:opacity-50 md:text-sm";

export const iconBtn =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 active:bg-stone-200 active:scale-[0.97]";

export const fabButton =
  "fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition hover:bg-primary-hover active:scale-95 lg:hidden";

export const mobileMainPadding =
  "pb-[calc(56px+env(safe-area-inset-bottom,0px))] lg:pb-0";

export const bottomSheetPanel =
  "relative z-10 flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-surface shadow-xl md:max-w-lg md:rounded-xl";

export const amount = "font-mono tabular-nums font-semibold text-stone-900";

export const amountLg = `${amount} text-lg`;

export const formCard = `${card} space-y-4`;

export const inlineError = "text-sm text-negative";

export const householdNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition active:opacity-80 ${
    isActive
      ? "bg-primary text-white shadow-sm"
      : "text-stone-700 hover:bg-stone-100"
  }`;

export const pageActionsRow = "flex flex-wrap items-start justify-between gap-4";

export const expenseFormPanel =
  "hidden xl:flex xl:w-80 xl:shrink-0 xl:sticky xl:top-6 xl:self-start xl:max-h-[calc(100dvh-7rem)] xl:min-h-0 xl:flex-col";

export const tabBarHeight = "56px";

export const fabBottomOffset =
  "calc(56px + 16px + env(safe-area-inset-bottom, 0px))";
