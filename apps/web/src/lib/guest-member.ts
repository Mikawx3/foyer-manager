export interface GuestMemberSession {
  householdId: string;
  tenantId: string;
  invitePath: string;
}

const STORAGE_KEY = "foyer.guestMember";

function canUseSessionStorage(): boolean {
  return typeof sessionStorage !== "undefined";
}

export function saveGuestMemberSession(session: GuestMemberSession): void {
  if (!canUseSessionStorage()) {
    return;
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function readGuestMemberSession(householdId: string): GuestMemberSession | null {
  if (!canUseSessionStorage()) {
    return null;
  }
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("householdId" in parsed) ||
    !("tenantId" in parsed) ||
    !("invitePath" in parsed) ||
    parsed.householdId !== householdId ||
    typeof parsed.tenantId !== "string" ||
    typeof parsed.invitePath !== "string"
  ) {
    return null;
  }

  return {
    householdId,
    tenantId: parsed.tenantId,
    invitePath: parsed.invitePath,
  };
}

export function clearGuestMemberSession(): void {
  if (!canUseSessionStorage()) {
    return;
  }
  sessionStorage.removeItem(STORAGE_KEY);
}
