import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearAuth, setToken } from "./auth-storage.ts";
import {
  clearGuestMemberSession,
  readGuestMemberSession,
  saveGuestMemberSession,
} from "./guest-member.ts";

function createStorageMock(): Storage {
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

const session = { householdId: "hh-1", tenantId: "tenant-1", invitePath: "/invite/abc" };

describe("guest member session", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createStorageMock());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("survives a new tab because it lives next to the guest token", () => {
    saveGuestMemberSession(session);
    expect(localStorage.getItem("foyer.guestMember")).not.toBeNull();
    expect(readGuestMemberSession("hh-1")).toEqual(session);
  });

  it("only matches the household it was saved for", () => {
    saveGuestMemberSession(session);
    expect(readGuestMemberSession("hh-2")).toBeNull();
  });

  it("ignores corrupted values", () => {
    localStorage.setItem("foyer.guestMember", "{not json");
    expect(readGuestMemberSession("hh-1")).toBeNull();
  });

  it("is cleared on explicit clear and on sign out", () => {
    saveGuestMemberSession(session);
    clearGuestMemberSession();
    expect(readGuestMemberSession("hh-1")).toBeNull();

    saveGuestMemberSession(session);
    setToken("guest-token");
    clearAuth();
    expect(readGuestMemberSession("hh-1")).toBeNull();
  });
});
