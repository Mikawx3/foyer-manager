import {
  clearGuestMemberSession,
  parkGuestMemberSession,
  restoreGuestMemberSession,
} from "./guest-member.ts";

const TOKEN_KEY = "fm_token";
const GUEST_RESUME_KEY = "fm_guest_resume";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function clearAuth(): void {
  clearToken();
  clearGuestMemberSession();
}

export function getGuestResumeToken(): string | null {
  return localStorage.getItem(GUEST_RESUME_KEY);
}

/** A guest has no password. Signing out closes the screen and keeps the visit on this browser. */
export function signOutActiveSession(isGuest: boolean): void {
  if (isGuest) {
    const token = getToken();
    if (token) {
      localStorage.setItem(GUEST_RESUME_KEY, token);
    }
    parkGuestMemberSession();
  }
  clearAuth();
}

export function resumeGuestSession(): boolean {
  const token = getGuestResumeToken();
  if (!token) {
    return false;
  }
  setToken(token);
  restoreGuestMemberSession();
  localStorage.removeItem(GUEST_RESUME_KEY);
  return true;
}
