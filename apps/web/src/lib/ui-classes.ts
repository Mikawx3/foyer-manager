export const pageTitle = "text-lg font-semibold tracking-tight text-stone-900 md:text-2xl";

export const pageSubtitle = "mt-1 text-base text-stone-600 md:text-sm";

export const card =
  "rounded-xl border border-border bg-surface p-4 shadow-sm transition hover:shadow-md active:shadow-sm";

export const cardInteractive =
  "block rounded-xl border border-border bg-surface p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md active:border-primary/40 active:shadow-sm";

export const btnPrimary =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 py-2 text-base font-medium text-white hover:bg-primary-hover active:scale-[0.98] active:opacity-90 disabled:opacity-50 md:text-sm";

export const btnSecondary =
  "inline-flex min-h-11 items-center justify-center text-base font-medium text-primary hover:text-primary-hover active:scale-[0.98] active:opacity-80 disabled:opacity-50 md:text-sm";

export const iconBtn =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 active:bg-stone-200 active:scale-[0.97]";

export const fabButton =
  "fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition hover:bg-primary-hover active:scale-95 md:hidden";

export const mobileMainPadding =
  "pb-[calc(56px+env(safe-area-inset-bottom,0px))] md:pb-0";

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

export const stickyFormPanel =
  "hidden xl:block xl:w-80 xl:shrink-0 xl:sticky xl:top-24 xl:self-start space-y-4";

export const tabBarHeight = "56px";

export const fabBottomOffset =
  "calc(56px + 16px + env(safe-area-inset-bottom, 0px))";
