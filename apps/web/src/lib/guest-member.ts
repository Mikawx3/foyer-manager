export interface GuestMemberSession {
  householdId: string;
  tenantId: string;
  invitePath: string;
}

const STORAGE_KEY = "foyer.guestMember";

/** Same storage as the guest token, so a returning guest still sees who they are and can keep that name. */
function canUseLocalStorage(): boolean {
  return typeof localStorage !== "undefined";
}

export function saveGuestMemberSession(session: GuestMemberSession): void {
  if (!canUseLocalStorage()) {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function readGuestMemberSession(householdId: string): GuestMemberSession | null {
  if (!canUseLocalStorage()) {
    return null;
  }
  const raw = localStorage.getItem(STORAGE_KEY);
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
  if (!canUseLocalStorage()) {
    return;
  }
  localStorage.removeItem(STORAGE_KEY);
}
