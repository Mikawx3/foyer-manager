const STICKY_PREFIX = "fm.expense-form.sticky.";
const SESSION_PREFIX = "fm.expense-form.session.";
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface ExpenseFormDefaults {
  paidByTenantId: string;
  participantIds: string[];
  date: string;
}

interface StickyDefaults {
  paidByTenantId: string;
  participantIds: string[];
}

interface SessionDefaults {
  date: string;
}

type DefaultsListener = (householdId: string) => void;

const listeners = new Set<DefaultsListener>();

function stickyKey(householdId: string): string {
  return `${STICKY_PREFIX}${householdId}`;
}

function sessionKey(householdId: string): string {
  return `${SESSION_PREFIX}${householdId}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function parseSticky(value: unknown): StickyDefaults | null {
  if (!isRecord(value) || typeof value.paidByTenantId !== "string") {
    return null;
  }
  if (!Array.isArray(value.participantIds)) {
    return null;
  }
  if (!value.participantIds.every((id) => typeof id === "string")) {
    return null;
  }
  return {
    paidByTenantId: value.paidByTenantId,
    participantIds: value.participantIds,
  };
}

function parseSession(value: unknown): SessionDefaults | null {
  if (!isRecord(value) || typeof value.date !== "string") {
    return null;
  }
  if (!DATE_PATTERN.test(value.date)) {
    return null;
  }
  return { date: value.date };
}

function readSticky(householdId: string): StickyDefaults | null {
  const raw = localStorage.getItem(stickyKey(householdId));
  if (raw === null) {
    return null;
  }
  return parseSticky(parseJson(raw));
}

function readSession(householdId: string): SessionDefaults | null {
  const raw = sessionStorage.getItem(sessionKey(householdId));
  if (raw === null) {
    return null;
  }
  return parseSession(parseJson(raw));
}

function writeJson(storage: Storage, key: string, value: StickyDefaults | SessionDefaults): void {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota / private-mode failures; the current form still keeps values in memory.
  }
}

function notify(householdId: string): void {
  for (const listener of listeners) {
    listener(householdId);
  }
}

export function resolveExpenseFormDefaults(
  householdId: string,
  tenantIds: string[],
  today: string,
): ExpenseFormDefaults {
  const tenantIdSet = new Set(tenantIds);
  const sticky = readSticky(householdId);
  const session = readSession(householdId);

  const validParticipants = (sticky?.participantIds ?? []).filter((id) => tenantIdSet.has(id));
  const paidByTenantId =
    sticky !== null && tenantIdSet.has(sticky.paidByTenantId) ? sticky.paidByTenantId : "";

  return {
    paidByTenantId,
    participantIds: validParticipants.length > 0 ? validParticipants : [...tenantIds],
    date: session?.date ?? today,
  };
}

export function saveExpenseFormDefaults(
  householdId: string,
  defaults: ExpenseFormDefaults,
): void {
  writeJson(localStorage, stickyKey(householdId), {
    paidByTenantId: defaults.paidByTenantId,
    participantIds: defaults.participantIds,
  });
  writeJson(sessionStorage, sessionKey(householdId), {
    date: defaults.date,
  });
  notify(householdId);
}

export function subscribeExpenseFormDefaults(listener: DefaultsListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
