export interface GuestPromptInput {
  isGuest: boolean;
  dismissed: boolean;
  visitCount: number;
  firstExpenseJustSaved: boolean;
}

/** Show the account sheet after the first expense, or from the second calendar-day visit. */
export function shouldPromptGuestAccount(input: GuestPromptInput): boolean {
  if (!input.isGuest || input.dismissed) {
    return false;
  }
  return input.firstExpenseJustSaved || input.visitCount >= 2;
}

const VISITS_KEY = "foyer.guestVisits";
const DISMISS_KEY = "foyer.guestPromptDismissed";
const EXPENSE_LATCH_KEY = "foyer.guestExpensePrompted";

export const GUEST_FIRST_EXPENSE_EVENT = "foyer-guest-first-expense";

export function calendarDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function recordGuestVisit(today: string): number {
  if (typeof localStorage === "undefined") {
    return 1;
  }
  const days = readVisitDays();
  if (!days.includes(today)) {
    days.push(today);
    localStorage.setItem(VISITS_KEY, JSON.stringify(days));
  }
  return days.length;
}

export function isGuestPromptDismissed(): boolean {
  return typeof sessionStorage !== "undefined" && sessionStorage.getItem(DISMISS_KEY) === "1";
}

export function dismissGuestPrompt(): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }
  sessionStorage.setItem(DISMISS_KEY, "1");
}

/** Signals the household shell once, the first time this browser saves an expense. */
export function markFirstExpenseSaved(): void {
  if (typeof localStorage === "undefined" || typeof window === "undefined") {
    return;
  }
  if (localStorage.getItem(EXPENSE_LATCH_KEY) === "1") {
    return;
  }
  localStorage.setItem(EXPENSE_LATCH_KEY, "1");
  window.dispatchEvent(new Event(GUEST_FIRST_EXPENSE_EVENT));
}

function readVisitDays(): string[] {
  const raw = localStorage.getItem(VISITS_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((day): day is string => typeof day === "string");
  } catch {
    return [];
  }
}
