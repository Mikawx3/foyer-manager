import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearAuth, clearToken, getToken, setToken } from "./auth-storage.ts";

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
});
