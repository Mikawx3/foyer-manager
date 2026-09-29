export interface GuestMemberSession {
  householdId: string;
  tenantId: string;
  invitePath: string;
}

const STORAGE_KEY = "foyer.guestMember";
const RESUME_KEY = "foyer.guestMember.resume";

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

/** Keep the chosen name across a guest sign-out, then put it back when the visit resumes. */
export function parkGuestMemberSession(): void {
  if (!canUseLocalStorage()) {
    return;
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    localStorage.setItem(RESUME_KEY, raw);
  }
  localStorage.removeItem(STORAGE_KEY);
}

export function restoreGuestMemberSession(): void {
  if (!canUseLocalStorage()) {
    return;
  }
  const raw = localStorage.getItem(RESUME_KEY);
  if (raw) {
    localStorage.setItem(STORAGE_KEY, raw);
  }
  localStorage.removeItem(RESUME_KEY);
}
