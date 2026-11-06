import { describe, expect, it } from "vitest";
import { LOCALE_STORAGE_KEY, readStoredLocale, storeLocale } from "./locale-preference.ts";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}

describe("locale preference", () => {
  it("returns null without a stored value or with an unknown one", () => {
    expect(readStoredLocale(memoryStorage())).toBeNull();
    expect(readStoredLocale(memoryStorage({ [LOCALE_STORAGE_KEY]: "de" }))).toBeNull();
    expect(readStoredLocale(null)).toBeNull();
  });

  it("round-trips a supported locale", () => {
    const storage = memoryStorage();
    storeLocale("en", storage);
    expect(readStoredLocale(storage)).toBe("en");
    storeLocale("fr", storage);
    expect(readStoredLocale(storage)).toBe("fr");
  });
});
