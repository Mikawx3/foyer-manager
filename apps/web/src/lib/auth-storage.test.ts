import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { saveGuestMemberSession, readGuestMemberSession } from "./guest-member.ts";
import {
  clearAuth,
  clearToken,
  getGuestResumeToken,
  getToken,
  resumeGuestSession,
  setToken,
  signOutActiveSession,
} from "./auth-storage.ts";

function createLocalStorageMock(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => [...store.keys()][index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
}

describe("auth-storage", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createLocalStorageMock());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("stores and reads token", () => {
    setToken("abc123");
    expect(getToken()).toBe("abc123");
  });

  it("clearToken removes token only", () => {
    setToken("abc123");
    clearToken();
    expect(getToken()).toBeNull();
  });

  it("clearAuth removes token", () => {
    setToken("abc123");
    clearAuth();
    expect(getToken()).toBeNull();
  });

  it("parks a guest visit on sign-out and restores it", () => {
    setToken("guest-token");
    saveGuestMemberSession({
      householdId: "hh-1",
      tenantId: "tenant-1",
      invitePath: "/invite/abc",
    });

    signOutActiveSession(true);

    expect(getToken()).toBeNull();
    expect(readGuestMemberSession("hh-1")).toBeNull();
    expect(getGuestResumeToken()).toBe("guest-token");

    expect(resumeGuestSession()).toBe(true);
    expect(getToken()).toBe("guest-token");
    expect(getGuestResumeToken()).toBeNull();
    expect(readGuestMemberSession("hh-1")).toEqual({
      householdId: "hh-1",
      tenantId: "tenant-1",
      invitePath: "/invite/abc",
    });
  });

  it("drops an account token on sign-out", () => {
    setToken("account-token");
    signOutActiveSession(false);
    expect(getToken()).toBeNull();
    expect(getGuestResumeToken()).toBeNull();
    expect(resumeGuestSession()).toBe(false);
  });
});
